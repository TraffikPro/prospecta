import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { AuthorizationError } from "@/server/auth/errors";
import { hashPassword } from "@/server/auth/password";
import { createActivity } from "@/server/repositories/activity.repository";
import { createActivityForLead } from "./activity.service";
import { moveLeadStage } from "./lead.service";
import {
  PortfolioError,
  getPortfolioSummaryForUser,
  markAssignmentTreatedInTx,
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
  const outsiderEmail = `pf-out-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";
  let otherId = "";
  let outsiderId = "";
  let leadHighId = "";
  let leadLowId = "";
  const createdLeadIds: string[] = [];

  async function createHighLead(ownerId: string, label: string) {
    const lead = await prisma.lead.create({
      data: {
        companyName: `PF ${label} ${stamp}`,
        email: `pf-${label}-${stamp}-${Math.random().toString(36).slice(2, 8)}@acme.example`,
        stage: "NEW",
        ownerId,
        intelligence: {
          score: 90,
          qualification: "HIGH",
          signals: ["NO_WEBSITE"],
        },
      },
    });
    createdLeadIds.push(lead.id);
    return lead;
  }

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

    const outsider = await prisma.user.upsert({
      where: { email: outsiderEmail },
      update: {
        isActive: true,
        role: "MEMBER",
        canRunAcquisition: true,
      },
      create: {
        email: outsiderEmail,
        name: "PF Outsider",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("PortfolioOutsider123!"),
        isActive: true,
      },
    });
    outsiderId = outsider.id;

    const high = await createHighLead(memberId, "high");
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
    createdLeadIds.push(low.id);
  });

  after(async () => {
    await prisma.leadAssignment.deleteMany({
      where: { leadId: { in: createdLeadIds } },
    });
    await prisma.activity.deleteMany({
      where: { leadId: { in: createdLeadIds } },
    });
    await prisma.weeklyPortfolio.deleteMany({
      where: { userId: { in: [adminId, memberId, otherId, outsiderId] } },
    });
    await prisma.operatorWeeklyQuota.deleteMany({
      where: { userId: { in: [adminId, memberId, otherId, outsiderId] } },
    });
    await prisma.adminAuditEvent.deleteMany({
      where: {
        OR: [
          { actorId: { in: [adminId, memberId] } },
          { targetUserId: { in: [memberId, otherId, outsiderId] } },
        ],
      },
    });
    await prisma.lead.deleteMany({
      where: { id: { in: createdLeadIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, memberId, otherId, outsiderId] } },
    });
    await prisma.$disconnect();
  });

  it("without quota: summary has no meta and opening does not create portfolio", async () => {
    await prisma.operatorWeeklyQuota.deleteMany({
      where: { userId: memberId },
    });
    await prisma.weeklyPortfolio.deleteMany({ where: { userId: memberId } });

    const beforePortfolios = await prisma.weeklyPortfolio.count({
      where: { userId: memberId },
    });
    const beforeAssignments = await prisma.leadAssignment.count({
      where: { assigneeId: memberId },
    });

    const summary = await getPortfolioSummaryForUser(memberId);
    assert.equal(summary.quotaConfigured, false);
    assert.equal(summary.target, 0);
    assert.equal(summary.slotsRemaining, 0);
    assert.equal(summary.eligibleOperator, true);

    const afterPortfolios = await prisma.weeklyPortfolio.count({
      where: { userId: memberId },
    });
    const afterAssignments = await prisma.leadAssignment.count({
      where: { assigneeId: memberId },
    });
    assert.equal(afterPortfolios, beforePortfolios);
    assert.equal(afterAssignments, beforeAssignments);
    assert.equal(afterPortfolios, 0);

    await assert.rejects(
      () =>
        reassignLeadToOperator({
          actorId: adminId,
          leadId: leadHighId,
          assigneeId: memberId,
        }),
      (err: unknown) =>
        err instanceof PortfolioError &&
        err.message.includes("Meta semanal ainda não configurada"),
    );
  });

  it("ADMIN sets quota then assigns manually; Minha fila read path still does not write", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 3,
    });

    const beforeAssign = await prisma.leadAssignment.count({
      where: { leadId: leadHighId },
    });
    const summaryBefore = await getPortfolioSummaryForUser(memberId);
    assert.equal(summaryBefore.quotaConfigured, true);
    assert.equal(summaryBefore.target, 3);
    assert.equal(summaryBefore.assigned, 0);

    const afterReadAssignments = await prisma.leadAssignment.count({
      where: { leadId: leadHighId },
    });
    assert.equal(afterReadAssignments, beforeAssign);

    const result = await reassignLeadToOperator({
      actorId: adminId,
      leadId: leadHighId,
      assigneeId: memberId,
    });
    assert.ok(result.assignmentId);
    assert.equal(result.idempotent, false);

    const stored = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: result.assignmentId },
    });
    assert.equal(stored.assignedById, adminId);

    const summary = await getPortfolioSummaryForUser(memberId);
    assert.equal(summary.assigned, 1);
    assert.equal(summary.slotsRemaining, 2);

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

  it("rejects weekly quota for inactive target user", async () => {
    const inactive = await prisma.user.create({
      data: {
        email: `pf-inactive-${stamp}@prospecta.test`,
        name: "PF Inactive",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("PortfolioInactive123!"),
        isActive: false,
      },
    });

    try {
      await assert.rejects(
        () =>
          setOperatorWeeklyQuota({
            actorId: adminId,
            targetUserId: inactive.id,
            weeklyTarget: 5,
          }),
        (err: unknown) =>
          err instanceof PortfolioError &&
          err.message.includes("usuário inativo"),
      );
    } finally {
      await prisma.user.delete({ where: { id: inactive.id } });
    }
  });

  it("createActivityForLead treats assignment atomically", async () => {
    const result = await createActivityForLead({
      leadId: leadHighId,
      authorId: memberId,
      type: "WHATSAPP",
      outcome: "NOT_INTERESTED",
      body: "Contato carteira",
    });
    assert.ok(result.activityId);

    const assignment = await prisma.leadAssignment.findFirstOrThrow({
      where: { leadId: leadHighId },
      orderBy: { assignedAt: "desc" },
    });
    assert.equal(assignment.status, "TREATED");
    assert.equal(assignment.treatedActivityId, result.activityId);
  });

  it("rolls back Activity when treat update fails inside the same transaction", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 5,
    });
    const lead = await createHighLead(memberId, "atomic");
    await reassignLeadToOperator({
      actorId: adminId,
      leadId: lead.id,
      assigneeId: otherId,
    });

    const probeBody = `rollback-treat-${stamp}`;

    await assert.rejects(async () => {
      await prisma.$transaction(async (tx) => {
        const activity = await createActivity(
          {
            leadId: lead.id,
            authorId: otherId,
            type: "EMAIL",
            outcome: "SENT_NO_REPLY",
            body: probeBody,
          },
          tx,
        );

        // Simulate treat failure (invalid FK) after Activity insert — both must roll back.
        await markAssignmentTreatedInTx(tx, {
          leadId: lead.id,
          activityId: "cm00000000000000000000000",
          authorId: otherId,
          type: "EMAIL",
          outcome: "SENT_NO_REPLY",
          activityCreatedAt: activity.createdAt,
        });
      });
    });

    const count = await prisma.activity.count({
      where: { leadId: lead.id, body: probeBody },
    });
    assert.equal(count, 0);

    const stillActive = await prisma.leadAssignment.count({
      where: { leadId: lead.id, status: "ACTIVE" },
    });
    assert.equal(stillActive, 1);
  });

  it("concurrent portfolio creation is idempotent", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: outsiderId,
      weeklyTarget: 10,
    });
    await prisma.weeklyPortfolio.deleteMany({ where: { userId: outsiderId } });

    const leadA = await createHighLead(adminId, "conc-a");
    const leadB = await createHighLead(adminId, "conc-b");

    const results = await Promise.all([
      reassignLeadToOperator({
        actorId: adminId,
        leadId: leadA.id,
        assigneeId: outsiderId,
      }),
      reassignLeadToOperator({
        actorId: adminId,
        leadId: leadB.id,
        assigneeId: outsiderId,
      }),
    ]);
    assert.equal(results.length, 2);

    const portfolios = await prisma.weeklyPortfolio.findMany({
      where: { userId: outsiderId },
    });
    assert.equal(portfolios.length, 1);
  });

  it("concurrent last-slot assignments yield only one ACTIVE/TREATED toward quota", async () => {
    const slotUserEmail = `pf-slot-${stamp}@prospecta.test`;
    const slotUser = await prisma.user.create({
      data: {
        email: slotUserEmail,
        name: "PF Slot",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("PortfolioSlot123!"),
        isActive: true,
      },
    });

    try {
      await setOperatorWeeklyQuota({
        actorId: adminId,
        targetUserId: slotUser.id,
        weeklyTarget: 1,
      });

      const lead1 = await createHighLead(adminId, "slot-1");
      const lead2 = await createHighLead(adminId, "slot-2");

      const outcomes = await Promise.allSettled([
        reassignLeadToOperator({
          actorId: adminId,
          leadId: lead1.id,
          assigneeId: slotUser.id,
        }),
        reassignLeadToOperator({
          actorId: adminId,
          leadId: lead2.id,
          assigneeId: slotUser.id,
        }),
      ]);

      const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
      const rejected = outcomes.filter((o) => o.status === "rejected");
      assert.equal(fulfilled.length, 1);
      assert.equal(rejected.length, 1);
      assert.ok(
        rejected[0]?.status === "rejected" &&
          rejected[0].reason instanceof PortfolioError,
      );

      const counted = await prisma.leadAssignment.count({
        where: {
          assigneeId: slotUser.id,
          status: { in: ["ACTIVE", "TREATED"] },
        },
      });
      assert.equal(counted, 1);
    } finally {
      await prisma.leadAssignment.deleteMany({
        where: { assigneeId: slotUser.id },
      });
      await prisma.activity.deleteMany({
        where: { lead: { ownerId: slotUser.id } },
      });
      await prisma.lead.deleteMany({ where: { ownerId: slotUser.id } });
      await prisma.weeklyPortfolio.deleteMany({
        where: { userId: slotUser.id },
      });
      await prisma.operatorWeeklyQuota.deleteMany({
        where: { userId: slotUser.id },
      });
      await prisma.adminAuditEvent.deleteMany({
        where: { targetUserId: slotUser.id },
      });
      await prisma.user.delete({ where: { id: slotUser.id } });
    }
  });

  it("double-click same assignee is idempotent: one historical assignment and one audit", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 20,
    });
    const lead = await createHighLead(adminId, "dbl-click");

    const outcomes = await Promise.all([
      reassignLeadToOperator({
        actorId: adminId,
        leadId: lead.id,
        assigneeId: memberId,
        expectedActiveAssigneeId: adminId,
      }),
      reassignLeadToOperator({
        actorId: adminId,
        leadId: lead.id,
        assigneeId: memberId,
        expectedActiveAssigneeId: adminId,
      }),
    ]);

    assert.equal(outcomes[0]?.assignmentId, outcomes[1]?.assignmentId);
    assert.equal(
      outcomes.filter((o) => o.idempotent).length +
        outcomes.filter((o) => !o.idempotent).length,
      2,
    );
    assert.ok(outcomes.some((o) => !o.idempotent));
    assert.ok(outcomes.some((o) => o.idempotent));

    const history = await prisma.leadAssignment.findMany({
      where: { leadId: lead.id },
    });
    assert.equal(history.length, 1);

    const audits = await prisma.adminAuditEvent.findMany({
      where: { action: "lead.reassign", actorId: adminId },
    });
    const forLead = audits.filter((event) => {
      const detail = event.detail as { leadId?: string } | null;
      return detail?.leadId === lead.id;
    });
    assert.equal(forLead.length, 1);
  });

  it("concurrent assign to different assignees conflicts instead of last-write-wins", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 20,
    });
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 20,
    });

    const shared = await createHighLead(adminId, "shared");

    const outcomes = await Promise.allSettled([
      reassignLeadToOperator({
        actorId: adminId,
        leadId: shared.id,
        assigneeId: memberId,
        expectedActiveAssigneeId: adminId,
      }),
      reassignLeadToOperator({
        actorId: adminId,
        leadId: shared.id,
        assigneeId: otherId,
        expectedActiveAssigneeId: adminId,
      }),
    ]);

    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter((o) => o.status === "rejected");
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.ok(
      rejected[0]?.status === "rejected" &&
        rejected[0].reason instanceof PortfolioError &&
        String(rejected[0].reason.message).includes("Recarregue"),
    );

    const history = await prisma.leadAssignment.findMany({
      where: { leadId: shared.id },
    });
    assert.equal(history.length, 1);
    assert.equal(history[0]?.status, "ACTIVE");
  });

  it("explicit reassign with matching expectedActiveAssigneeId moves the lead", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 20,
    });
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 20,
    });
    const lead = await createHighLead(adminId, "explicit");
    const first = await reassignLeadToOperator({
      actorId: adminId,
      leadId: lead.id,
      assigneeId: memberId,
    });
    assert.equal(first.idempotent, false);

    const second = await reassignLeadToOperator({
      actorId: adminId,
      leadId: lead.id,
      assigneeId: otherId,
      expectedActiveAssigneeId: memberId,
    });
    assert.equal(second.idempotent, false);
    assert.notEqual(second.assignmentId, first.assignmentId);

    const active = await prisma.leadAssignment.findMany({
      where: { leadId: lead.id, status: "ACTIVE" },
    });
    assert.equal(active.length, 1);
    assert.equal(active[0]?.assigneeId, otherId);
    assert.equal(active[0]?.assignedById, adminId);
  });

  it("rejects LOW intelligence reassignment", async () => {
    await assert.rejects(
      () =>
        reassignLeadToOperator({
          actorId: adminId,
          leadId: leadLowId,
          assigneeId: otherId,
        }),
      (err: unknown) => err instanceof PortfolioError,
    );
  });

  it("MEMBER cannot create Activity or move stage on another member's lead; ADMIN can", async () => {
    const ownedByOther = await createHighLead(otherId, "owned-other");
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 10,
    });
    await reassignLeadToOperator({
      actorId: adminId,
      leadId: ownedByOther.id,
      assigneeId: otherId,
    });

    await assert.rejects(
      () =>
        createActivityForLead({
          leadId: ownedByOther.id,
          authorId: memberId,
          type: "NOTE",
          body: "tentativa indevida",
        }),
      AuthorizationError,
    );

    await assert.rejects(
      () =>
        moveLeadStage({
          leadId: ownedByOther.id,
          actorId: memberId,
          stage: "QUALIFIED",
        }),
      AuthorizationError,
    );

    const adminActivity = await createActivityForLead({
      leadId: ownedByOther.id,
      authorId: adminId,
      type: "NOTE",
      body: "ADMIN pode operar",
    });
    assert.ok(adminActivity.activityId);

    const stage = await moveLeadStage({
      leadId: ownedByOther.id,
      actorId: adminId,
      stage: "QUALIFIED",
    });
    assert.equal(stage.to, "QUALIFIED");
  });

  it("MEMBER cannot escalate privileges by calling services with a forged ADMIN role", async () => {
    const ownedByOther = await createHighLead(otherId, "spoof");
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 10,
    });
    await reassignLeadToOperator({
      actorId: adminId,
      leadId: ownedByOther.id,
      assigneeId: otherId,
    });

    // Role comes from DB for authorId/actorId — there is no actorRole input to forge.
    await assert.rejects(
      () =>
        createActivityForLead({
          leadId: ownedByOther.id,
          authorId: memberId,
          type: "NOTE",
          body: "spoof attempt",
        }),
      AuthorizationError,
    );
    await assert.rejects(
      () =>
        moveLeadStage({
          leadId: ownedByOther.id,
          actorId: memberId,
          stage: "CONTACTED",
        }),
      AuthorizationError,
    );
  });
});
