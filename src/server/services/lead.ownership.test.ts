import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { LeadDuplicateError } from "@/features/leads/lead.errors";
import { AuthorizationError } from "@/server/auth/errors";
import { assertCanAccessLead } from "@/server/auth/lead-access";
import { hashPassword } from "@/server/auth/password";
import type { SessionUser } from "@/server/auth/types";
import { assertSafeForMutableTestsOrThrow } from "@/lib/safety/production-mutation-guard";
import { getActivitiesForLead } from "./activity.service";
import {
  createLeadForOwner,
  getLeadById,
  getLeads,
  getLeadsGroupedByStage,
  moveLeadStage,
} from "./lead.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

function toViewer(
  user: { id: string; name: string; email: string; role: "ADMIN" | "MEMBER" },
): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    canRunAcquisition: false,
    mustChangePassword: false,
  };
}

describe("lead ownership isolation", { skip: !hasDatabase }, () => {
  const suffix = Date.now().toString(36);
  let adminId = "";
  let memberAId = "";
  let memberBId = "";
  let leadAId = "";
  let leadBId = "";
  let adminViewer: SessionUser;
  let memberAViewer: SessionUser;
  let memberBViewer: SessionUser;

  before(async () => {
    assertSafeForMutableTestsOrThrow({
      databaseUrl: process.env.DATABASE_URL,
    });
    const passwordHash = await hashPassword("LeadOwnerTest123!");
    const [admin, memberA, memberB] = await Promise.all([
      prisma.user.create({
        data: {
          email: `owner-admin-${suffix}@prospecta.test`,
          name: "Owner Test Admin",
          role: "ADMIN",
          passwordHash,
          isActive: true,
        },
      }),
      prisma.user.create({
        data: {
          email: `owner-member-a-${suffix}@prospecta.test`,
          name: "Owner Test Member A",
          role: "MEMBER",
          passwordHash,
          isActive: true,
        },
      }),
      prisma.user.create({
        data: {
          email: `owner-member-b-${suffix}@prospecta.test`,
          name: "Owner Test Member B",
          role: "MEMBER",
          passwordHash,
          isActive: true,
        },
      }),
    ]);

    adminId = admin.id;
    memberAId = memberA.id;
    memberBId = memberB.id;
    adminViewer = toViewer(admin);
    memberAViewer = toViewer(memberA);
    memberBViewer = toViewer(memberB);

    const [leadA, leadB] = await Promise.all([
      prisma.lead.create({
        data: {
          companyName: `Empresa Alpha ${suffix}`,
          email: `alpha-${suffix}@acme.example`,
          stage: "NEW",
          source: "MANUAL",
          ownerId: memberAId,
        },
      }),
      prisma.lead.create({
        data: {
          companyName: `Empresa Beta ${suffix}`,
          email: `beta-${suffix}@acme.example`,
          phone: "11977776666",
          stage: "QUALIFIED",
          source: "GOOGLE_PLACES",
          ownerId: memberBId,
        },
      }),
    ]);

    leadAId = leadA.id;
    leadBId = leadB.id;
  });

  after(async () => {
    try {
      const emails = [
        `owner-admin-${suffix}@prospecta.test`,
        `owner-member-a-${suffix}@prospecta.test`,
        `owner-member-b-${suffix}@prospecta.test`,
      ];
      const users = await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);
      if (userIds.length > 0) {
        await prisma.activity.deleteMany({
          where: { authorId: { in: userIds } },
        });
        await prisma.lead.deleteMany({
          where: { ownerId: { in: userIds } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it("ADMIN receives leads from different owners", async () => {
    const leads = await getLeads(adminViewer);
    const ids = leads.map((lead) => lead.id);
    assert.ok(ids.includes(leadAId));
    assert.ok(ids.includes(leadBId));
  });

  it("MEMBER A receives only own leads", async () => {
    const leads = await getLeads(memberAViewer);
    assert.equal(leads.length, 1);
    assert.equal(leads[0]?.id, leadAId);
    assert.equal(leads[0]?.ownerId, memberAId);
  });

  it("MEMBER A never receives MEMBER B id, company, stage or source", async () => {
    const leads = await getLeads(memberAViewer);
    const serialized = JSON.stringify(leads);
    assert.equal(serialized.includes(leadBId), false);
    assert.equal(serialized.includes(`Empresa Beta ${suffix}`), false);
    assert.equal(
      leads.some(
        (lead) =>
          lead.stage === "QUALIFIED" && lead.source === "GOOGLE_PLACES",
      ),
      false,
    );

    const grouped = await getLeadsGroupedByStage(memberAViewer);
    const groupedIds = Object.values(grouped).flatMap((column) =>
      column.map((lead) => lead.id),
    );
    assert.equal(groupedIds.includes(leadBId), false);
    assert.ok(groupedIds.includes(leadAId));
  });

  it("MEMBER A does not receive existingLeadId for MEMBER B contact", async () => {
    await assert.rejects(
      () =>
        createLeadForOwner({
          companyName: `Tentativa Dup ${suffix}`,
          email: `beta-${suffix}@acme.example`,
          ownerId: memberAId,
          actor: memberAViewer,
        }),
      (error: unknown) =>
        error instanceof LeadDuplicateError &&
        error.existingLeadId === undefined,
    );
  });

  it("ADMIN still receives existingLeadId for a duplicate owned by MEMBER B", async () => {
    await assert.rejects(
      () =>
        createLeadForOwner({
          companyName: `Admin Dup ${suffix}`,
          email: `beta-${suffix}@acme.example`,
          ownerId: adminId,
          actor: adminViewer,
        }),
      (error: unknown) =>
        error instanceof LeadDuplicateError &&
        error.existingLeadId === leadBId,
    );
  });

  it("MEMBER continues to access and mutate own leads", async () => {
    const listed = await getLeads(memberBViewer);
    assert.equal(listed[0]?.id, leadBId);

    const detail = await getLeadById(leadBId);
    assert.ok(detail);
    assert.doesNotThrow(() =>
      assertCanAccessLead(detail, memberBViewer),
    );

    const moved = await moveLeadStage({
      leadId: leadBId,
      actorId: memberBId,
      stage: "CONTACTED",
    });
    assert.equal(moved.from, "QUALIFIED");
    assert.equal(moved.to, "CONTACTED");
  });

  it("MEMBER is denied detail and mutation of another owner's lead", async () => {
    const foreign = await getLeadById(leadBId);
    assert.ok(foreign);
    assert.throws(
      () => assertCanAccessLead(foreign, memberAViewer),
      AuthorizationError,
    );

    await assert.rejects(
      () =>
        getActivitiesForLead(leadBId, {
          id: memberAId,
          role: "MEMBER",
        }),
      AuthorizationError,
    );

    await assert.rejects(
      () =>
        moveLeadStage({
          leadId: leadBId,
          actorId: memberAId,
          stage: "MEETING",
        }),
      AuthorizationError,
    );
  });
});
