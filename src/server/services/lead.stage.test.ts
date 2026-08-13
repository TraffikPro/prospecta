import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { LeadValidationError } from "@/features/leads/lead.errors";
import { parseStageChangeBody } from "@/features/leads/stage-change";
import { hashPassword } from "@/server/auth/password";
import { moveLeadStage } from "./lead.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe("moveLeadStage", { skip: !hasDatabase }, () => {
  let ownerId = "";
  let leadId = "";
  const suffix = Date.now().toString(36);

  before(async () => {
    const user = await prisma.user.upsert({
      where: { email: `pipeline-test-${suffix}@prospecta.test` },
      update: { isActive: true },
      create: {
        email: `pipeline-test-${suffix}@prospecta.test`,
        name: "Pipeline Test Owner",
        role: "MEMBER",
        passwordHash: await hashPassword("PipelineTest123!"),
        isActive: true,
      },
    });
    ownerId = user.id;

    const lead = await prisma.lead.create({
      data: {
        companyName: `Empresa Pipeline ${suffix}`,
        email: `pipeline-${suffix}@acme.example`,
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
      where: { email: `pipeline-test-${suffix}@prospecta.test` },
    });
    await prisma.$disconnect();
  });

  it("moves stage and creates STAGE_CHANGE activity with structured body", async () => {
    const result = await moveLeadStage({
      leadId,
      actorId: ownerId,
      stage: "QUALIFIED",
    });

    assert.equal(result.from, "NEW");
    assert.equal(result.to, "QUALIFIED");

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    assert.equal(lead.stage, "QUALIFIED");

    const activity = await prisma.activity.findUniqueOrThrow({
      where: { id: result.activityId },
    });
    assert.equal(activity.type, "STAGE_CHANGE");
    assert.deepEqual(parseStageChangeBody(activity.body), {
      from: "NEW",
      to: "QUALIFIED",
    });
  });

  it("rejects same stage", async () => {
    await assert.rejects(
      () =>
        moveLeadStage({
          leadId,
          actorId: ownerId,
          stage: "QUALIFIED",
        }),
      LeadValidationError,
    );
  });

  it("rejects LOST without reason and accepts with reason", async () => {
    await assert.rejects(
      () =>
        moveLeadStage({
          leadId,
          actorId: ownerId,
          stage: "LOST",
        }),
      LeadValidationError,
    );

    const result = await moveLeadStage({
      leadId,
      actorId: ownerId,
      stage: "LOST",
      lostReason: "Perdeu para concorrente",
    });

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    assert.equal(lead.stage, "LOST");
    assert.equal(lead.lostReason, "Perdeu para concorrente");
    assert.equal(result.to, "LOST");
  });
});
