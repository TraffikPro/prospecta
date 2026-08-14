import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { walletFillFingerprint } from "@/features/acquisition/acquisition.schema";
import { getOperationalWeek } from "@/features/portfolio/week";
import { hashPassword } from "@/server/auth/password";
import { applyAcquisitionJobCallback } from "./acquisition-job.service";
import {
  PortfolioError,
  assignLeadFromWalletFill,
  assignWalletFillLeads,
  getPortfolioSummaryForUser,
  reassignLeadToOperator,
  recycleLeadToPool,
  setOperatorWeeklyQuota,
} from "./portfolio.service";
import { requestWalletFill } from "./wallet-fill.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe("wallet fill F3", { skip: !hasDatabase }, () => {
  const stamp = Date.now().toString(36);
  const adminEmail = `f3-admin-${stamp}@prospecta.test`;
  const memberEmail = `f3-member-${stamp}@prospecta.test`;
  const otherEmail = `f3-other-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";
  let otherId = "";
  const createdLeadIds: string[] = [];
  const originalFetch = globalThis.fetch;

  async function createHighLead(ownerId: string, label: string) {
    const lead = await prisma.lead.create({
      data: {
        companyName: `F3 ${label} ${stamp}`,
        email: `f3-${label}-${stamp}-${Math.random().toString(36).slice(2, 8)}@acme.example`,
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
    process.env.ACQUISITION_RUNNER_URL = "http://runner.test";
    process.env.ACQUISITION_JOB_TOKEN = "f3-test-acquisition-job-token-value";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    globalThis.fetch = (async () =>
      new Response(null, { status: 202 })) as typeof fetch;

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "F3 Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("WalletFillAdmin123!"),
        isActive: true,
      },
    });
    adminId = admin.id;

    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        name: "F3 Member",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("WalletFillMember123!"),
        isActive: true,
      },
    });
    memberId = member.id;

    const other = await prisma.user.create({
      data: {
        email: otherEmail,
        name: "F3 Other",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("WalletFillOther123!"),
        isActive: true,
      },
    });
    otherId = other.id;
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    await prisma.leadAssignment.deleteMany({
      where: { leadId: { in: createdLeadIds } },
    });
    await prisma.activity.deleteMany({
      where: { leadId: { in: createdLeadIds } },
    });
    await prisma.weeklyPortfolio.deleteMany({
      where: { userId: { in: [adminId, memberId, otherId] } },
    });
    await prisma.operatorWeeklyQuota.deleteMany({
      where: { userId: { in: [adminId, memberId, otherId] } },
    });
    await prisma.adminAuditEvent.deleteMany({
      where: { actorId: { in: [adminId, memberId, otherId] } },
    });
    await prisma.acquisitionJob.deleteMany({
      where: { requestedById: { in: [adminId, memberId, otherId] } },
    });
    await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, memberId, otherId] } },
    });
    await prisma.$disconnect();
  });

  it("does not run without quota, when complete, or when inactive", async () => {
    await assert.rejects(
      () => requestWalletFill({ actorId: memberId }),
      (err: unknown) =>
        err instanceof PortfolioError &&
        err.message.includes("Meta semanal ainda não configurada"),
    );

    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 2,
    });
    const lead = await createHighLead(adminId, "prefill");
    await reassignLeadToOperator({
      actorId: adminId,
      leadId: lead.id,
      assigneeId: memberId,
    });
    const second = await createHighLead(adminId, "prefill-2");
    await reassignLeadToOperator({
      actorId: adminId,
      leadId: second.id,
      assigneeId: memberId,
    });
    await assert.rejects(
      () => requestWalletFill({ actorId: memberId }),
      (err: unknown) =>
        err instanceof PortfolioError && err.message.includes("já está completa"),
    );

    const summary = await getPortfolioSummaryForUser(memberId);
    assert.equal(summary.slotsRemaining, 0);

    await prisma.user.update({
      where: { id: memberId },
      data: { isActive: false },
    });
    await prisma.leadAssignment.deleteMany({
      where: { leadId: { in: [lead.id, second.id] } },
    });
    await prisma.weeklyPortfolio.updateMany({
      where: { userId: memberId },
      data: { targetSnapshot: 5 },
    });
    await assert.rejects(
      () => requestWalletFill({ actorId: memberId }),
      (err: unknown) =>
        err instanceof PortfolioError && err.message.includes("inativo"),
    );
    await prisma.user.update({
      where: { id: memberId },
      data: { isActive: true },
    });
  });

  it("persists requestedBy, reuses one active job, and ignores client-forged owner", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 5,
    });
    await prisma.weeklyPortfolio.updateMany({
      where: { userId: memberId },
      data: { targetSnapshot: 5 },
    });

    const first = await requestWalletFill({ actorId: memberId });
    const second = await requestWalletFill({ actorId: memberId });
    assert.equal(first.id, second.id);
    assert.equal(second.reused, true);

    const job = await prisma.acquisitionJob.findUniqueOrThrow({
      where: { id: first.id },
    });
    assert.equal(job.requestedById, memberId);
    assert.equal(job.purpose, "WALLET_FILL");
    assert.ok((job.requestedSlots ?? 0) > 0);

    const parallel = await Promise.allSettled([
      requestWalletFill({ actorId: memberId }),
      requestWalletFill({ actorId: memberId }),
    ]);
    const ids = parallel
      .filter((row) => row.status === "fulfilled")
      .map((row) => row.value.id);
    assert.ok(ids.every((id) => id === first.id));

    const active = await prisma.acquisitionJob.count({
      where: {
        requestedById: memberId,
        purpose: "WALLET_FILL",
        status: { in: ["QUEUED", "RUNNING"] },
      },
    });
    assert.equal(active, 1);
  });

  it("assigns only eligible returned IDs to the job requester", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 5,
    });

    const high = await createHighLead(adminId, "fill-high");
    const existing = await createHighLead(adminId, "fill-existing");
    const medium = await prisma.lead.create({
      data: {
        companyName: `F3 med ${stamp}`,
        email: `f3-med-${stamp}@acme.example`,
        stage: "NEW",
        ownerId: adminId,
        intelligence: {
          score: 55,
          qualification: "MEDIUM",
          signals: [],
        },
      },
    });
    createdLeadIds.push(medium.id);
    const won = await createHighLead(adminId, "fill-won");
    await prisma.lead.update({
      where: { id: won.id },
      data: { stage: "WON" },
    });

    const missingId = "clxxxxxxxxxxxxxxxxxxxxxx";
    const result = await assignWalletFillLeads({
      requestedById: otherId,
      leadIds: [high.id, existing.id, medium.id, won.id, missingId, high.id],
      requestedSlots: 5,
    });
    assert.equal(result.assignedCount, 2);

    const assigned = await prisma.leadAssignment.findMany({
      where: {
        assigneeId: otherId,
        status: "ACTIVE",
        source: "NEW_ACQUISITION",
      },
    });
    assert.equal(assigned.length, 2);
    assert.ok(assigned.every((row) => row.assignedById === otherId));
    assert.equal(
      await prisma.leadAssignment.count({
        where: { leadId: medium.id, status: "ACTIVE" },
      }),
      0,
    );
    assert.equal(
      await prisma.leadAssignment.count({
        where: { leadId: won.id, status: "ACTIVE" },
      }),
      0,
    );
  });

  it("does not assign a lead already at the F2 cap", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 10,
    });
    await prisma.weeklyPortfolio.updateMany({
      where: { userId: memberId },
      data: { targetSnapshot: 10 },
    });

    const capped = await createHighLead(adminId, "capped");
    await reassignLeadToOperator({
      actorId: adminId,
      leadId: capped.id,
      assigneeId: memberId,
    });
    await prisma.leadAssignment.updateMany({
      where: { leadId: capped.id, status: "ACTIVE" },
      data: { status: "TREATED", treatedAt: new Date() },
    });
    await recycleLeadToPool({ actorId: adminId, leadId: capped.id });
    await reassignLeadToOperator({
      actorId: adminId,
      leadId: capped.id,
      assigneeId: memberId,
    });
    await prisma.leadAssignment.updateMany({
      where: { leadId: capped.id, status: "ACTIVE" },
      data: { status: "TREATED", treatedAt: new Date() },
    });

    const before = await prisma.leadAssignment.count({
      where: { leadId: capped.id, status: "ACTIVE" },
    });
    await assignWalletFillLeads({
      requestedById: memberId,
      leadIds: [capped.id],
      requestedSlots: 3,
    });
    const after = await prisma.leadAssignment.count({
      where: { leadId: capped.id, status: "ACTIVE" },
    });
    assert.equal(before, 0);
    assert.equal(after, 0);
  });

  it("stops at remaining slots and keeps one ACTIVE per lead", async () => {
    const slotUser = await prisma.user.create({
      data: {
        email: `f3-slot-${stamp}@prospecta.test`,
        name: "F3 Slot",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("WalletFillSlot123!"),
        isActive: true,
      },
    });
    try {
      await setOperatorWeeklyQuota({
        actorId: adminId,
        targetUserId: slotUser.id,
        weeklyTarget: 1,
      });
      const a = await createHighLead(adminId, "slot-a");
      const b = await createHighLead(adminId, "slot-b");

      const outcomes = await Promise.allSettled([
        assignLeadFromWalletFill({ actorId: slotUser.id, leadId: a.id }),
        assignLeadFromWalletFill({ actorId: slotUser.id, leadId: b.id }),
      ]);
      const fulfilled = outcomes.filter((row) => row.status === "fulfilled");
      const rejected = outcomes.filter((row) => row.status === "rejected");
      assert.equal(fulfilled.length, 1);
      assert.equal(rejected.length, 1);

      const counted = await prisma.leadAssignment.count({
        where: {
          assigneeId: slotUser.id,
          status: { in: ["ACTIVE", "TREATED"] },
        },
      });
      assert.equal(counted, 1);

      const sameLead = await createHighLead(adminId, "same-id");
      await prisma.weeklyPortfolio.updateMany({
        where: { userId: slotUser.id },
        data: { targetSnapshot: 5 },
      });
      await setOperatorWeeklyQuota({
        actorId: adminId,
        targetUserId: slotUser.id,
        weeklyTarget: 5,
      });
      await prisma.weeklyPortfolio.updateMany({
        where: { userId: slotUser.id },
        data: { targetSnapshot: 5 },
      });
      const twice = await Promise.allSettled([
        assignLeadFromWalletFill({ actorId: slotUser.id, leadId: sameLead.id }),
        assignLeadFromWalletFill({ actorId: slotUser.id, leadId: sameLead.id }),
      ]);
      assert.ok(twice.every((row) => row.status === "fulfilled"));
      assert.equal(
        await prisma.leadAssignment.count({
          where: { leadId: sameLead.id, status: "ACTIVE" },
        }),
        1,
      );
    } finally {
      await prisma.leadAssignment.deleteMany({
        where: { assigneeId: slotUser.id },
      });
      await prisma.lead.updateMany({
        where: { ownerId: slotUser.id },
        data: { ownerId: adminId },
      });
      await prisma.weeklyPortfolio.deleteMany({
        where: { userId: slotUser.id },
      });
      await prisma.operatorWeeklyQuota.deleteMany({
        where: { userId: slotUser.id },
      });
      await prisma.adminAuditEvent.deleteMany({
        where: {
          OR: [
            { actorId: slotUser.id },
            { targetUserId: slotUser.id },
          ],
        },
      });
      await prisma.user.delete({ where: { id: slotUser.id } });
    }
  });

  it("callback assigns to requestedBy and rejects mismatched requestedById", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 8,
    });
    await prisma.weeklyPortfolio.updateMany({
      where: { userId: otherId },
      data: { targetSnapshot: 8 },
    });

    const job = await prisma.acquisitionJob.create({
      data: {
        city: "Santos SP",
        query: "clínica odontológica",
        limit: 6,
        campaign: "santos-odontologia",
        fingerprint: `fill|${otherId}|callback-${stamp}`,
        requestedById: otherId,
        timeoutAt: new Date(Date.now() + 15 * 60 * 1000),
        status: "QUEUED",
        purpose: "WALLET_FILL",
        requestedSlots: 3,
      },
    });

    const leadA = await createHighLead(adminId, "cb-a");
    const leadB = await createHighLead(adminId, "cb-b");
    const leadC = await createHighLead(adminId, "cb-c");
    const leadD = await createHighLead(adminId, "cb-d");
    const leadE = await createHighLead(adminId, "cb-e");

    await applyAcquisitionJobCallback(job.id, { status: "RUNNING" });
    const done = await applyAcquisitionJobCallback(job.id, {
      status: "SUCCEEDED",
      requestedById: otherId,
      leadIds: [leadA.id, leadB.id, leadC.id],
    });
    assert.equal(done.status, "SUCCEEDED");
    const stored = await prisma.acquisitionJob.findUniqueOrThrow({
      where: { id: job.id },
    });
    assert.equal(stored.assignedCount, 3);
    assert.equal(stored.requestedById, otherId);

    assert.equal(
      await prisma.leadAssignment.count({
        where: { assigneeId: memberId, leadId: { in: [leadA.id, leadB.id, leadC.id] } },
      }),
      0,
    );

    const failedJob = await prisma.acquisitionJob.create({
      data: {
        city: "Santos SP",
        query: "clínica odontológica",
        limit: 4,
        campaign: "santos-odontologia",
        fingerprint: `fill|${otherId}|fail-${stamp}`,
        requestedById: otherId,
        timeoutAt: new Date(Date.now() + 15 * 60 * 1000),
        status: "QUEUED",
        purpose: "WALLET_FILL",
        requestedSlots: 2,
      },
    });
    const beforeFail = await prisma.leadAssignment.count({
      where: { assigneeId: otherId, leadId: leadD.id },
    });
    await applyAcquisitionJobCallback(failedJob.id, {
      status: "FAILED",
      errorMessage: "Places timeout",
      leadIds: [leadD.id, leadE.id],
    });
    assert.equal(
      await prisma.leadAssignment.count({
        where: { assigneeId: otherId, leadId: { in: [leadD.id, leadE.id] } },
      }),
      beforeFail,
    );

    const mismatch = await prisma.acquisitionJob.create({
      data: {
        city: "Santos SP",
        query: "clínica odontológica",
        limit: 4,
        campaign: "santos-odontologia",
        fingerprint: `fill|${otherId}|mismatch-${stamp}`,
        requestedById: otherId,
        timeoutAt: new Date(Date.now() + 15 * 60 * 1000),
        status: "QUEUED",
        purpose: "WALLET_FILL",
        requestedSlots: 1,
      },
    });
    await assert.rejects(
      () =>
        applyAcquisitionJobCallback(mismatch.id, {
          status: "SUCCEEDED",
          requestedById: memberId,
          leadIds: [leadD.id],
        }),
    );
  });

  it("partial fill assigns 3 of 5 and zero HIGH is operational success", async () => {
    const partialUser = await prisma.user.create({
      data: {
        email: `f3-partial-${stamp}@prospecta.test`,
        name: "F3 Partial",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("WalletFillPartial123!"),
        isActive: true,
      },
    });
    try {
      await setOperatorWeeklyQuota({
        actorId: adminId,
        targetUserId: partialUser.id,
        weeklyTarget: 5,
      });
      const ids = [];
      for (let i = 0; i < 3; i += 1) {
        ids.push((await createHighLead(adminId, `partial-${i}`)).id);
      }
      const filled = await assignWalletFillLeads({
        requestedById: partialUser.id,
        leadIds: ids,
        requestedSlots: 5,
      });
      assert.equal(filled.assignedCount, 3);
      assert.equal(filled.remainingSlots, 2);

      const zero = await assignWalletFillLeads({
        requestedById: partialUser.id,
        leadIds: [],
        requestedSlots: 2,
      });
      assert.equal(zero.assignedCount, 0);
      assert.equal(zero.remainingSlots, 2);
    } finally {
      await prisma.leadAssignment.deleteMany({
        where: { assigneeId: partialUser.id },
      });
      await prisma.lead.updateMany({
        where: { ownerId: partialUser.id },
        data: { ownerId: adminId },
      });
      await prisma.weeklyPortfolio.deleteMany({
        where: { userId: partialUser.id },
      });
      await prisma.operatorWeeklyQuota.deleteMany({
        where: { userId: partialUser.id },
      });
      await prisma.adminAuditEvent.deleteMany({
        where: {
          OR: [
            { actorId: partialUser.id },
            { targetUserId: partialUser.id },
          ],
        },
      });
      await prisma.user.delete({ where: { id: partialUser.id } });
    }
  });

  it("MEMBER fill assigns only to self and GET summary stays read-only", async () => {
    const beforeJobs = await prisma.acquisitionJob.count({
      where: { requestedById: memberId },
    });
    const beforeAssignments = await prisma.leadAssignment.count({
      where: { assigneeId: memberId },
    });
    await getPortfolioSummaryForUser(memberId);
    assert.equal(
      await prisma.acquisitionJob.count({
        where: { requestedById: memberId },
      }),
      beforeJobs,
    );
    assert.equal(
      await prisma.leadAssignment.count({
        where: { assigneeId: memberId },
      }),
      beforeAssignments,
    );

    const steal = await createHighLead(adminId, "self-only");
    const result = await assignLeadFromWalletFill({
      actorId: memberId,
      leadId: steal.id,
    });
    const row = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: result.assignmentId },
    });
    assert.equal(row.assigneeId, memberId);
    assert.equal(row.source, "NEW_ACQUISITION");
  });

  it("late WALLET_FILL callback does not assign into the new week", async () => {
    const oldWeek = getOperationalWeek(new Date("2026-08-05T18:00:00.000Z"));
    const monday = new Date("2026-08-10T03:00:00.000Z");
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 8,
    });

    const job = await prisma.acquisitionJob.create({
      data: {
        city: "Santos SP",
        query: "clínica odontológica",
        limit: 4,
        campaign: "santos-odontologia",
        fingerprint: walletFillFingerprint(otherId, oldWeek.weekStartAt),
        requestedById: otherId,
        timeoutAt: new Date(monday.getTime() + 15 * 60 * 1000),
        status: "QUEUED",
        purpose: "WALLET_FILL",
        requestedSlots: 2,
      },
    });
    const lead = await createHighLead(adminId, "late-cb");

    await applyAcquisitionJobCallback(job.id, { status: "RUNNING" }, monday);
    const done = await applyAcquisitionJobCallback(
      job.id,
      {
        status: "SUCCEEDED",
        requestedById: otherId,
        leadIds: [lead.id],
      },
      monday,
    );
    assert.equal(done.status, "SUCCEEDED");

    const stored = await prisma.acquisitionJob.findUniqueOrThrow({
      where: { id: job.id },
    });
    assert.equal(stored.assignedCount, 0);
    assert.equal(
      await prisma.leadAssignment.count({ where: { leadId: lead.id } }),
      0,
    );
  });
});
