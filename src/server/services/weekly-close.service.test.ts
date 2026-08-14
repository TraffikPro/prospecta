import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { GET as weeklyCloseCronGet } from "@/app/api/cron/weekly-portfolio-close/route";
import { walletFillFingerprint } from "@/features/acquisition/acquisition.schema";
import {
  RELEASE_REASON_RECYCLED,
  RELEASE_REASON_WEEK_CLOSED,
  countCommercialCycles,
} from "@/features/portfolio/portfolio.rules";
import { getOperationalWeek } from "@/features/portfolio/week";
import { hashPassword } from "@/server/auth/password";
import { applyAcquisitionJobCallback } from "./acquisition-job.service";
import { getMyQueueForOwner } from "./lead.service";
import {
  getPortfolioSummaryForUser,
  listHighPoolReview,
  reassignLeadToOperator,
  setOperatorWeeklyQuota,
} from "./portfolio.service";
import { closeExpiredWeeklyPortfolios } from "./weekly-close.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

const OLD_WEEK_NOW = new Date("2026-08-05T18:00:00.000Z");
const SUNDAY_END = new Date("2026-08-10T02:59:59.999Z");
const MONDAY_START = new Date("2026-08-10T03:00:00.000Z");
const MID_CURRENT = new Date("2026-08-12T18:00:00.000Z");

describe("weekly close F4", { skip: !hasDatabase }, () => {
  const stamp = Date.now().toString(36);
  const adminEmail = `f4-admin-${stamp}@prospecta.test`;
  const memberEmail = `f4-member-${stamp}@prospecta.test`;
  const otherEmail = `f4-other-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";
  let otherId = "";
  const createdLeadIds: string[] = [];
  const previousCronSecret = process.env.CRON_SECRET;

  const oldWeek = getOperationalWeek(OLD_WEEK_NOW);
  const currentWeek = getOperationalWeek(MID_CURRENT);

  async function createLead(input: {
    ownerId: string;
    label: string;
    qualification?: "HIGH" | "MEDIUM";
    stage?: "NEW" | "WON" | "LOST";
  }) {
    const qualification = input.qualification ?? "HIGH";
    const lead = await prisma.lead.create({
      data: {
        companyName: `F4 ${input.label} ${stamp}`,
        email: `f4-${input.label}-${stamp}-${Math.random().toString(36).slice(2, 8)}@acme.example`,
        stage: input.stage ?? "NEW",
        ownerId: input.ownerId,
        intelligence: {
          score: qualification === "HIGH" ? 90 : 55,
          qualification,
          signals: qualification === "HIGH" ? ["NO_WEBSITE"] : [],
        },
      },
    });
    createdLeadIds.push(lead.id);
    return lead;
  }

  async function createPortfolio(
    userId: string,
    week: { weekStartAt: Date; weekEndAt: Date },
    targetSnapshot = 5,
  ) {
    const existing = await prisma.weeklyPortfolio.findUnique({
      where: {
        userId_weekStartAt: { userId, weekStartAt: week.weekStartAt },
      },
    });
    if (existing) return existing;
    return prisma.weeklyPortfolio.create({
      data: {
        userId,
        weekStartAt: week.weekStartAt,
        weekEndAt: week.weekEndAt,
        targetSnapshot,
      },
    });
  }

  async function createAssignment(input: {
    leadId: string;
    assigneeId: string;
    portfolioId: string;
    weekStartAt: Date;
    weekEndAt: Date;
    status: "ACTIVE" | "TREATED" | "RELEASED";
    releaseReason?: string | null;
    releasedAt?: Date | null;
  }) {
    return prisma.leadAssignment.create({
      data: {
        leadId: input.leadId,
        assigneeId: input.assigneeId,
        assignedById: adminId,
        portfolioId: input.portfolioId,
        weekStartAt: input.weekStartAt,
        source: "MANUAL_ADMIN",
        status: input.status,
        dueAt: input.weekEndAt,
        treatedAt: input.status === "TREATED" ? OLD_WEEK_NOW : null,
        releasedAt: input.releasedAt ?? null,
        releaseReason: input.releaseReason ?? null,
      },
    });
  }

  before(async () => {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "F4 Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("WeeklyCloseAdmin123!"),
        isActive: true,
      },
    });
    adminId = admin.id;

    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        name: "F4 Member",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("WeeklyCloseMember123!"),
        isActive: true,
      },
    });
    memberId = member.id;

    const other = await prisma.user.create({
      data: {
        email: otherEmail,
        name: "F4 Other",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("WeeklyCloseOther123!"),
        isActive: true,
      },
    });
    otherId = other.id;

    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 5,
    });
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 5,
    });
  });

  after(async () => {
    if (previousCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previousCronSecret;
    }
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

  afterEach(() => {
    if (previousCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previousCronSecret;
    }
  });

  it("does not close the current week and leaves Sunday 23:59:59.999 SP open", async () => {
    const currentPortfolio = await createPortfolio(memberId, currentWeek);
    const currentLead = await createLead({ ownerId: memberId, label: "current" });
    const currentAssignment = await createAssignment({
      leadId: currentLead.id,
      assigneeId: memberId,
      portfolioId: currentPortfolio.id,
      weekStartAt: currentWeek.weekStartAt,
      weekEndAt: currentWeek.weekEndAt,
      status: "ACTIVE",
    });

    const expiredPortfolio = await createPortfolio(otherId, oldWeek);
    const expiredLead = await createLead({ ownerId: otherId, label: "sunday-still-open" });
    await createAssignment({
      leadId: expiredLead.id,
      assigneeId: otherId,
      portfolioId: expiredPortfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "ACTIVE",
    });

    const atSunday = await closeExpiredWeeklyPortfolios(SUNDAY_END);
    assert.equal(atSunday.assignmentsReleased, 0);

    const stillActive = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: currentAssignment.id },
    });
    assert.equal(stillActive.status, "ACTIVE");
    assert.equal(stillActive.releaseReason, null);

    const midWeek = await closeExpiredWeeklyPortfolios(MID_CURRENT);
    const currentAfter = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: currentAssignment.id },
    });
    assert.equal(currentAfter.status, "ACTIVE");
    assert.ok(midWeek.portfoliosProcessed >= 1);
  });

  it("releases expired ACTIVE once with WEEK_CLOSED and is idempotent", async () => {
    const portfolio = await createPortfolio(memberId, oldWeek);
    const activeLead = await createLead({ ownerId: memberId, label: "active" });
    const treatedLead = await createLead({ ownerId: memberId, label: "treated" });
    const releasedLead = await createLead({ ownerId: memberId, label: "released" });
    const originalReleasedAt = new Date("2026-08-06T12:00:00.000Z");

    const active = await createAssignment({
      leadId: activeLead.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "ACTIVE",
    });
    const treated = await createAssignment({
      leadId: treatedLead.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "TREATED",
    });
    const released = await createAssignment({
      leadId: releasedLead.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "RELEASED",
      releaseReason: RELEASE_REASON_RECYCLED,
      releasedAt: originalReleasedAt,
    });

    const quotasBefore = await prisma.operatorWeeklyQuota.count({
      where: { userId: memberId },
    });
    const portfoliosBefore = await prisma.weeklyPortfolio.count({
      where: { userId: memberId, weekStartAt: currentWeek.weekStartAt },
    });
    const ownerBefore = (await prisma.lead.findUniqueOrThrow({
      where: { id: activeLead.id },
    })).ownerId;

    const first = await closeExpiredWeeklyPortfolios(MONDAY_START);
    assert.ok(first.assignmentsReleased >= 1);

    const closed = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: active.id },
    });
    assert.equal(closed.status, "RELEASED");
    assert.equal(closed.releaseReason, RELEASE_REASON_WEEK_CLOSED);
    assert.ok(closed.releasedAt);
    assert.equal(closed.releasedAt?.toISOString(), MONDAY_START.toISOString());

    const treatedAfter = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: treated.id },
    });
    assert.equal(treatedAfter.status, "TREATED");
    assert.equal(treatedAfter.releaseReason, null);

    const releasedAfter = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: released.id },
    });
    assert.equal(releasedAfter.status, "RELEASED");
    assert.equal(releasedAfter.releaseReason, RELEASE_REASON_RECYCLED);
    assert.equal(
      releasedAfter.releasedAt?.toISOString(),
      originalReleasedAt.toISOString(),
    );

    const ownerAfter = (await prisma.lead.findUniqueOrThrow({
      where: { id: activeLead.id },
    })).ownerId;
    assert.equal(ownerAfter, ownerBefore);

    const second = await closeExpiredWeeklyPortfolios(MONDAY_START);
    const closedAgain = await prisma.leadAssignment.findUniqueOrThrow({
      where: { id: active.id },
    });
    assert.equal(closedAgain.releasedAt?.toISOString(), closed.releasedAt?.toISOString());
    assert.equal(second.assignmentsReleased, 0);

    assert.equal(
      countCommercialCycles([
        {
          status: closed.status,
          releaseReason: closed.releaseReason,
        },
      ]),
      0,
    );

    const quotasAfter = await prisma.operatorWeeklyQuota.count({
      where: { userId: memberId },
    });
    assert.equal(quotasAfter, quotasBefore);

    const summary = await getPortfolioSummaryForUser(memberId, MONDAY_START);
    assert.equal(summary.quotaConfigured, true);
    assert.equal(
      await prisma.leadAssignment.count({
        where: {
          leadId: { in: [activeLead.id, treatedLead.id, releasedLead.id] },
          weekStartAt: currentWeek.weekStartAt,
        },
      }),
      0,
    );
    assert.equal(
      await prisma.leadAssignment.count({
        where: { portfolioId: portfolio.id, status: "ACTIVE" },
      }),
      0,
    );

    await getMyQueueForOwner(memberId);
    const portfoliosAfter = await prisma.weeklyPortfolio.count({
      where: { userId: memberId, weekStartAt: currentWeek.weekStartAt },
    });
    assert.equal(portfoliosAfter, portfoliosBefore);

    const review = await listHighPoolReview(adminId);
    assert.ok(review.eligible.some((item) => item.id === activeLead.id));
    assert.ok(!review.eligible.some((item) => item.id === treatedLead.id));
    assert.equal(
      review.recyclable.some((item) => item.id === treatedLead.id),
      true,
    );
  });

  it("keeps MEDIUM, WON and cap-2 leads out of the HIGH pool after close", async () => {
    const portfolio = await createPortfolio(otherId, oldWeek);
    const medium = await createLead({
      ownerId: otherId,
      label: "medium",
      qualification: "MEDIUM",
    });
    const won = await createLead({
      ownerId: otherId,
      label: "won",
      stage: "WON",
    });
    const capped = await createLead({ ownerId: otherId, label: "capped" });

    await createAssignment({
      leadId: medium.id,
      assigneeId: otherId,
      portfolioId: portfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "ACTIVE",
    });
    await createAssignment({
      leadId: won.id,
      assigneeId: otherId,
      portfolioId: portfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "ACTIVE",
    });
    await prisma.leadAssignment.create({
      data: {
        leadId: capped.id,
        assigneeId: otherId,
        assignedById: adminId,
        portfolioId: portfolio.id,
        weekStartAt: oldWeek.weekStartAt,
        source: "RECYCLED",
        status: "RELEASED",
        dueAt: oldWeek.weekEndAt,
        releasedAt: OLD_WEEK_NOW,
        releaseReason: RELEASE_REASON_RECYCLED,
      },
    });
    await prisma.leadAssignment.create({
      data: {
        leadId: capped.id,
        assigneeId: otherId,
        assignedById: adminId,
        portfolioId: portfolio.id,
        weekStartAt: oldWeek.weekStartAt,
        source: "RECYCLED",
        status: "RELEASED",
        dueAt: oldWeek.weekEndAt,
        releasedAt: OLD_WEEK_NOW,
        releaseReason: RELEASE_REASON_RECYCLED,
      },
    });

    await closeExpiredWeeklyPortfolios(MONDAY_START);
    const review = await listHighPoolReview(adminId);
    assert.ok(!review.eligible.some((item) => item.id === medium.id));
    assert.ok(!review.eligible.some((item) => item.id === won.id));
    assert.ok(review.capped.some((item) => item.id === capped.id));
  });

  it("closes concurrently to a single WEEK_CLOSED state", async () => {
    const portfolio = await createPortfolio(memberId, oldWeek);
    const lead = await createLead({ ownerId: memberId, label: "concurrent" });
    const assignment = await createAssignment({
      leadId: lead.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "ACTIVE",
    });

    await Promise.all([
      closeExpiredWeeklyPortfolios(MONDAY_START),
      closeExpiredWeeklyPortfolios(MONDAY_START),
    ]);

    const rows = await prisma.leadAssignment.findMany({
      where: { leadId: lead.id },
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.id, assignment.id);
    assert.equal(rows[0]?.status, "RELEASED");
    assert.equal(rows[0]?.releaseReason, RELEASE_REASON_WEEK_CLOSED);
    assert.equal(
      await prisma.leadAssignment.count({
        where: { leadId: lead.id, status: "ACTIVE" },
      }),
      0,
    );
  });

  it("stays consistent with concurrent ADMIN reassign and WALLET_FILL", async () => {
    const portfolio = await createPortfolio(memberId, oldWeek);
    const adminLead = await createLead({ ownerId: memberId, label: "admin-race" });
    const fillLead = await createLead({ ownerId: memberId, label: "fill-race" });
    await createAssignment({
      leadId: adminLead.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "ACTIVE",
    });
    await createAssignment({
      leadId: fillLead.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      weekStartAt: oldWeek.weekStartAt,
      weekEndAt: oldWeek.weekEndAt,
      status: "ACTIVE",
    });

    const job = await prisma.acquisitionJob.create({
      data: {
        city: "Santos SP",
        query: "clínica odontológica",
        limit: 4,
        campaign: "santos-odontologia",
        fingerprint: walletFillFingerprint(otherId, currentWeek.weekStartAt),
        requestedById: otherId,
        timeoutAt: new Date(MONDAY_START.getTime() + 15 * 60 * 1000),
        status: "QUEUED",
        purpose: "WALLET_FILL",
        requestedSlots: 1,
      },
    });

    await applyAcquisitionJobCallback(job.id, { status: "RUNNING" }, MONDAY_START);

    await Promise.all([
      closeExpiredWeeklyPortfolios(MONDAY_START),
      reassignLeadToOperator({
        actorId: adminId,
        leadId: adminLead.id,
        assigneeId: otherId,
        expectedActiveAssigneeId: memberId,
        now: MONDAY_START,
      }).catch(() => null),
      applyAcquisitionJobCallback(
        job.id,
        {
          status: "SUCCEEDED",
          requestedById: otherId,
          leadIds: [fillLead.id],
        },
        MONDAY_START,
      ).catch(() => null),
    ]);

    await closeExpiredWeeklyPortfolios(MONDAY_START);

    assert.equal(
      await prisma.leadAssignment.count({
        where: { leadId: adminLead.id, status: "ACTIVE" },
      }) <= 1,
      true,
    );
    assert.equal(
      await prisma.leadAssignment.count({
        where: { leadId: fillLead.id, status: "ACTIVE" },
      }) <= 1,
      true,
    );

    const fillSummary = await getPortfolioSummaryForUser(otherId, MONDAY_START);
    assert.ok(fillSummary.assigned <= fillSummary.target);
  });

  it("current-week WALLET_FILL still assigns; stale fingerprint does not", async () => {
    const currentLead = await createLead({ ownerId: adminId, label: "fill-now" });
    const staleLead = await createLead({ ownerId: adminId, label: "fill-stale" });

    const currentJob = await prisma.acquisitionJob.create({
      data: {
        city: "Santos SP",
        query: "clínica odontológica",
        limit: 4,
        campaign: "santos-odontologia",
        fingerprint: walletFillFingerprint(otherId, currentWeek.weekStartAt),
        requestedById: otherId,
        timeoutAt: new Date(MID_CURRENT.getTime() + 15 * 60 * 1000),
        status: "QUEUED",
        purpose: "WALLET_FILL",
        requestedSlots: 1,
      },
    });
    await applyAcquisitionJobCallback(
      currentJob.id,
      { status: "RUNNING" },
      MID_CURRENT,
    );
    const currentDone = await applyAcquisitionJobCallback(
      currentJob.id,
      {
        status: "SUCCEEDED",
        requestedById: otherId,
        leadIds: [currentLead.id],
      },
      MID_CURRENT,
    );
    assert.equal(currentDone.status, "SUCCEEDED");
    const currentStored = await prisma.acquisitionJob.findUniqueOrThrow({
      where: { id: currentJob.id },
    });
    assert.equal(currentStored.assignedCount, 1);
    assert.equal(
      await prisma.leadAssignment.count({
        where: {
          leadId: currentLead.id,
          status: "ACTIVE",
          weekStartAt: currentWeek.weekStartAt,
        },
      }),
      1,
    );

    const staleJob = await prisma.acquisitionJob.create({
      data: {
        city: "Santos SP",
        query: "clínica odontológica",
        limit: 4,
        campaign: "santos-odontologia",
        fingerprint: walletFillFingerprint(otherId, oldWeek.weekStartAt),
        requestedById: otherId,
        timeoutAt: new Date(MID_CURRENT.getTime() + 15 * 60 * 1000),
        status: "QUEUED",
        purpose: "WALLET_FILL",
        requestedSlots: 1,
      },
    });
    await applyAcquisitionJobCallback(
      staleJob.id,
      { status: "RUNNING" },
      MID_CURRENT,
    );
    await applyAcquisitionJobCallback(
      staleJob.id,
      {
        status: "SUCCEEDED",
        requestedById: otherId,
        leadIds: [staleLead.id],
      },
      MID_CURRENT,
    );
    const staleStored = await prisma.acquisitionJob.findUniqueOrThrow({
      where: { id: staleJob.id },
    });
    assert.equal(staleStored.assignedCount, 0);
    assert.equal(
      await prisma.leadAssignment.count({ where: { leadId: staleLead.id } }),
      0,
    );
  });

  it("cron GET rejects invalid secret and runs with a valid one", async () => {
    process.env.CRON_SECRET = `f4-cron-${stamp}`;
    const unauthorized = await weeklyCloseCronGet(
      new Request("http://localhost/api/cron/weekly-portfolio-close"),
    );
    assert.equal(unauthorized.status, 401);

    const wrong = await weeklyCloseCronGet(
      new Request("http://localhost/api/cron/weekly-portfolio-close", {
        headers: { Authorization: "Bearer wrong-secret" },
      }),
    );
    assert.equal(wrong.status, 401);

    const ok = await weeklyCloseCronGet(
      new Request("http://localhost/api/cron/weekly-portfolio-close", {
        headers: { Authorization: `Bearer f4-cron-${stamp}` },
      }),
    );
    assert.equal(ok.status, 200);
    const body = (await ok.json()) as {
      portfoliosProcessed: number;
      assignmentsReleased: number;
      alreadyClosed: number;
      errors: number;
    };
    assert.equal(typeof body.portfoliosProcessed, "number");
    assert.equal(typeof body.assignmentsReleased, "number");
    assert.equal(typeof body.alreadyClosed, "number");
    assert.equal(typeof body.errors, "number");
  });
});
