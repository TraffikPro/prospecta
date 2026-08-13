import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "@/server/auth/password";
import {
  PortfolioError,
  enrollOwnedHighLeadsIntoPortfolio,
  getPortfolioSummaryForUser,
  markAssignmentTreatedFromActivity,
  reassignLeadToOperator,
  setOperatorWeeklyQuota,
} from "./portfolio.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe("portfolio.service", { skip: !hasDatabase }, () => {
  const stamp = Date.now().toString(36);
  const adminEmail = `pf-admin-${stamp}@prospecta.test`;
  const memberEmail = `pf-member-${stamp}@prospecta.test`;
  const otherEmail = `pf-other-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";
  let otherId = "";
  let leadHighId = "";
  let leadLowId = "";

  before(async () => {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { isActive: true, role: "ADMIN", canRunAcquisition: false },
      create: {
        email: adminEmail,
        name: "PF Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("PortfolioAdmin123!"),
        isActive: true,
      },
    });
    adminId = admin.id;

    const member = await prisma.user.upsert({
      where: { email: memberEmail },
      update: {
        isActive: true,
        role: "MEMBER",
        canRunAcquisition: true,
      },
      create: {
        email: memberEmail,
        name: "PF Member",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("PortfolioMember123!"),
        isActive: true,
      },
    });
    memberId = member.id;

    const other = await prisma.user.upsert({
      where: { email: otherEmail },
      update: {
        isActive: true,
        role: "MEMBER",
        canRunAcquisition: true,
      },
      create: {
        email: otherEmail,
        name: "PF Other",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("PortfolioOther123!"),
        isActive: true,
      },
    });
    otherId = other.id;

    const high = await prisma.lead.create({
      data: {
        companyName: `PF High ${stamp}`,
        email: `pf-high-${stamp}@acme.example`,
        stage: "NEW",
        ownerId: memberId,
        intelligence: {
          score: 85,
          qualification: "HIGH",
          signals: ["NO_WEBSITE"],
        },
      },
    });
    leadHighId = high.id;

    const low = await prisma.lead.create({
      data: {
        companyName: `PF Low ${stamp}`,
        email: `pf-low-${stamp}@acme.example`,
        stage: "NEW",
        ownerId: memberId,
        intelligence: {
          score: 40,
          qualification: "LOW",
          signals: [],
        },
      },
    });
    leadLowId = low.id;
  });

  after(async () => {
    await prisma.leadAssignment.deleteMany({
      where: { leadId: { in: [leadHighId, leadLowId] } },
    });
    await prisma.weeklyPortfolio.deleteMany({
      where: { userId: { in: [adminId, memberId, otherId] } },
    });
    await prisma.operatorWeeklyQuota.deleteMany({
      where: { userId: { in: [adminId, memberId, otherId] } },
    });
    await prisma.adminAuditEvent.deleteMany({
      where: {
        OR: [
          { actorId: { in: [adminId, memberId] } },
          { targetUserId: { in: [memberId, otherId] } },
        ],
      },
    });
    await prisma.lead.deleteMany({
      where: { id: { in: [leadHighId, leadLowId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, memberId, otherId] } },
    });
    await prisma.$disconnect();
  });

  it("sets weekly quota for authorized MEMBER", async () => {
    const result = await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 3,
    });
    assert.equal(result.weeklyTarget, 3);

    await assert.rejects(
      () =>
        setOperatorWeeklyQuota({
          actorId: adminId,
          targetUserId: memberId,
          weeklyTarget: 0,
        }),
      (err: unknown) => err instanceof PortfolioError,
    );
  });

  it("enrolls owned HIGH into portfolio up to quota", async () => {
    const { enrolled, summary } = await enrollOwnedHighLeadsIntoPortfolio({
      userId: memberId,
    });
    assert.equal(enrolled, 1);
    assert.equal(summary.assigned, 1);
    assert.equal(summary.target, 3);
    assert.equal(summary.slotsRemaining, 2);
    assert.equal(summary.eligibleOperator, true);

    const again = await enrollOwnedHighLeadsIntoPortfolio({
      userId: memberId,
    });
    assert.equal(again.enrolled, 0);
  });

  it("marks assignment treated from valid outreach activity", async () => {
    const active = await prisma.leadAssignment.findFirstOrThrow({
      where: { leadId: leadHighId, status: "ACTIVE" },
    });

    const activity = await prisma.activity.create({
      data: {
        leadId: leadHighId,
        authorId: memberId,
        type: "WHATSAPP",
        outcome: "SENT_NO_REPLY",
        body: "Primeiro contato",
      },
    });

    const ok = await markAssignmentTreatedFromActivity({
      leadId: leadHighId,
      activityId: activity.id,
      authorId: memberId,
      type: "WHATSAPP",
      outcome: "SENT_NO_REPLY",
      activityCreatedAt: activity.createdAt,
    });
    assert.equal(ok, true);

    const updated = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: active.id },
    });
    assert.equal(updated.status, "TREATED");
    assert.ok(updated.treatedAt);

    await prisma.activity.delete({ where: { id: activity.id } });
  });

  it("reassigns HIGH to another operator respecting quota", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 2,
    });

    // Reset lead to ACTIVE untreated for reassignment path: create fresh HIGH
    const fresh = await prisma.lead.create({
      data: {
        companyName: `PF Reassign ${stamp}`,
        email: `pf-reassign-${stamp}@acme.example`,
        stage: "NEW",
        ownerId: memberId,
        intelligence: {
          score: 90,
          qualification: "HIGH",
          signals: ["HIGH_RATING"],
        },
      },
    });

    await enrollOwnedHighLeadsIntoPortfolio({ userId: memberId });

    const result = await reassignLeadToOperator({
      actorId: adminId,
      leadId: fresh.id,
      assigneeId: otherId,
    });
    assert.ok(result.assignmentId);

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: fresh.id },
    });
    assert.equal(lead.ownerId, otherId);

    const summary = await getPortfolioSummaryForUser(otherId);
    assert.equal(summary.assigned, 1);

    await assert.rejects(
      () =>
        reassignLeadToOperator({
          actorId: adminId,
          leadId: leadLowId,
          assigneeId: otherId,
        }),
      (err: unknown) => err instanceof PortfolioError,
    );

    await prisma.leadAssignment.deleteMany({ where: { leadId: fresh.id } });
    await prisma.lead.delete({ where: { id: fresh.id } });
  });
});
