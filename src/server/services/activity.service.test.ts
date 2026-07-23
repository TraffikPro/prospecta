import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/server/auth/password";
import { createActivity } from "@/server/repositories/activity.repository";
import { createActivityForLead } from "./activity.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe("createActivityForLead", { skip: !hasDatabase }, () => {
  let ownerId = "";
  let leadId = "";
  const suffix = Date.now().toString(36);

  before(async () => {
    const user = await prisma.user.upsert({
      where: { email: `activity-test-${suffix}@prospecta.test` },
      update: { isActive: true },
      create: {
        email: `activity-test-${suffix}@prospecta.test`,
        name: "Activity Test Owner",
        role: "MEMBER",
        passwordHash: await hashPassword("ActivityTest123!"),
        isActive: true,
      },
    });
    ownerId = user.id;

    const lead = await prisma.lead.create({
      data: {
        companyName: `Empresa Activity ${suffix}`,
        email: `activity-${suffix}@acme.example`,
        stage: "NEW",
        ownerId,
      },
    });
    leadId = lead.id;
  });

  after(async () => {
    await prisma.activity.deleteMany({ where: { leadId } });
    await prisma.lead.deleteMany({ where: { id: leadId } });
    await prisma.user.deleteMany({
      where: { email: `activity-test-${suffix}@prospecta.test` },
    });
    await prisma.$disconnect();
  });

  it("creates activity, sets nextFollowUpAt, and auto-moves to CONTACTED", async () => {
    const followUp = new Date("2026-07-26T15:00:00.000Z");
    const result = await createActivityForLead({
      leadId,
      authorId: ownerId,
      type: "WHATSAPP",
      outcome: "INTERESTED",
      body: "Falou com responsável comercial",
      nextFollowUpAt: followUp.toISOString(),
    });

    assert.equal(result.stage, "CONTACTED");
    assert.ok(result.nextFollowUpAt);

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    assert.equal(lead.stage, "CONTACTED");
    assert.ok(lead.nextFollowUpAt);

    const activities = await prisma.activity.findMany({ where: { leadId } });
    assert.equal(activities.length, 1);
    assert.equal(activities[0]?.type, "WHATSAPP");
    assert.equal(activities[0]?.outcome, "INTERESTED");
  });

  it("rolls back activity when transaction fails after create", async () => {
    const isolatedLead = await prisma.lead.create({
      data: {
        companyName: `Empresa Rollback ${suffix}`,
        email: `rollback-${suffix}@acme.example`,
        stage: "QUALIFIED",
        ownerId,
      },
    });

    await assert.rejects(async () => {
      await prisma.$transaction(async (tx) => {
        await createActivity(
          {
            leadId: isolatedLead.id,
            authorId: ownerId,
            type: "EMAIL",
            outcome: "SENT_NO_REPLY",
            body: "Deve ser revertido",
          },
          tx,
        );
        throw new Error("forced failure");
      });
    });

    const count = await prisma.activity.count({
      where: { leadId: isolatedLead.id },
    });
    assert.equal(count, 0);

    await prisma.lead.delete({ where: { id: isolatedLead.id } });
  });
});
