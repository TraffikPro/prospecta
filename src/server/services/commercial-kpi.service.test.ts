import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import {
  RELEASE_REASON_ADMIN_REASSIGN,
  RELEASE_REASON_RECYCLED,
  RELEASE_REASON_WEEK_CLOSED,
} from "@/features/portfolio/portfolio.rules";
import { getOperationalWeek } from "@/features/portfolio/week";
import { AuthorizationError } from "@/server/auth/errors";
import { hashPassword } from "@/server/auth/password";
import {
  getCommercialWeeklyKpis,
  getOperatorWeeklyKpis,
} from "./commercial-kpi.service";
import { setOperatorWeeklyQuota } from "./portfolio.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

const WEEK_NOW = new Date("2026-01-14T18:00:00.000Z");
const OLD_WEEK_NOW = new Date("2026-01-07T18:00:00.000Z");
const SUNDAY_END = new Date("2026-01-19T02:59:59.999Z");
const MONDAY_START = new Date("2026-01-19T03:00:00.000Z");

describe("commercial weekly KPIs", { skip: !hasDatabase }, () => {
  const stamp = Date.now().toString(36);
  const adminEmail = `kpi-admin-${stamp}@prospecta.test`;
  const memberEmail = `kpi-member-${stamp}@prospecta.test`;
  const otherEmail = `kpi-other-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";
  let otherId = "";
  const createdLeadIds: string[] = [];

  const week = getOperationalWeek(WEEK_NOW);
  const oldWeek = getOperationalWeek(OLD_WEEK_NOW);

  async function createLead(ownerId: string, label: string) {
    const lead = await prisma.lead.create({
      data: {
        companyName: `KPI ${label} ${stamp}`,
        email: `kpi-${label}-${stamp}-${Math.random().toString(36).slice(2, 8)}@acme.example`,
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

  async function createPortfolio(
    userId: string,
    bounds: { weekStartAt: Date; weekEndAt: Date },
    targetSnapshot: number,
  ) {
    const existing = await prisma.weeklyPortfolio.findUnique({
      where: {
        userId_weekStartAt: { userId, weekStartAt: bounds.weekStartAt },
      },
    });
    if (existing) {
      return prisma.weeklyPortfolio.update({
        where: { id: existing.id },
        data: { targetSnapshot },
      });
    }
    return prisma.weeklyPortfolio.create({
      data: {
        userId,
        weekStartAt: bounds.weekStartAt,
        weekEndAt: bounds.weekEndAt,
        targetSnapshot,
      },
    });
  }

  async function createAssignment(input: {
    leadId: string;
    assigneeId: string;
    portfolioId: string;
    week: { weekStartAt: Date; weekEndAt: Date };
    source: "NEW_ACQUISITION" | "RECYCLED" | "MANUAL_ADMIN" | "ENROLL_OWNED";
    status: "ACTIVE" | "TREATED" | "RELEASED";
    releaseReason?: string | null;
    treatedAt?: Date | null;
  }) {
    return prisma.leadAssignment.create({
      data: {
        leadId: input.leadId,
        assigneeId: input.assigneeId,
        assignedById: adminId,
        portfolioId: input.portfolioId,
        weekStartAt: input.week.weekStartAt,
        source: input.source,
        status: input.status,
        dueAt: input.week.weekEndAt,
        treatedAt: input.treatedAt ?? null,
        releasedAt:
          input.status === "RELEASED" ? WEEK_NOW : null,
        releaseReason: input.releaseReason ?? null,
      },
    });
  }

  before(async () => {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "KPI Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("KpiAdmin123!"),
        isActive: true,
      },
    });
    adminId = admin.id;
    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        name: "KPI Member",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("KpiMember123!"),
        isActive: true,
      },
    });
    memberId = member.id;
    const other = await prisma.user.create({
      data: {
        email: otherEmail,
        name: "KPI Other",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("KpiOther123!"),
        isActive: true,
      },
    });
    otherId = other.id;
  });

  after(async () => {
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
    await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, memberId, otherId] } },
    });
    await prisma.$disconnect();
  });

  it("without quota: target 0 and KPI read does not create a portfolio", async () => {
    const before = await prisma.weeklyPortfolio.count({
      where: { userId: memberId },
    });
    const kpis = await getOperatorWeeklyKpis({
      actorId: memberId,
      userId: memberId,
      now: WEEK_NOW,
    });
    assert.equal(kpis.quotaConfigured, false);
    assert.equal(kpis.target, 0);
    assert.equal(kpis.assigned, 0);
    assert.equal(kpis.treatmentRate, 0);
    assert.equal(kpis.portfolioFillRate, 0);
    assert.equal(kpis.treatmentTargetRate, 0);
    const after = await prisma.weeklyPortfolio.count({
      where: { userId: memberId },
    });
    assert.equal(after, before);
  });

  it("uses configured quota on the current week and not another week's portfolio", async () => {
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 5,
    });
    const oldPortfolio = await createPortfolio(memberId, oldWeek, 9);
    const oldLead = await createLead(memberId, "old-week");
    await createAssignment({
      leadId: oldLead.id,
      assigneeId: memberId,
      portfolioId: oldPortfolio.id,
      week: oldWeek,
      source: "MANUAL_ADMIN",
      status: "ACTIVE",
    });

    const current = await getOperatorWeeklyKpis({
      actorId: memberId,
      userId: memberId,
      now: WEEK_NOW,
    });
    assert.equal(current.quotaConfigured, true);
    assert.equal(current.target, 5);
    assert.equal(current.assigned, 0);

    const previous = await getOperatorWeeklyKpis({
      actorId: memberId,
      userId: memberId,
      now: WEEK_NOW,
      weekStartAt: oldWeek.weekStartAt,
    });
    assert.equal(previous.target, 9);
    assert.equal(previous.assigned, 1);
    assert.equal(previous.pending, 1);
  });

  it("computes the mixed-source fixture without inflating ADMIN_REASSIGN", async () => {
    const portfolio = await createPortfolio(memberId, week, 5);
    const treatedAt = new Date("2026-01-14T15:00:00.000Z");
    const leads = await Promise.all([
      createLead(memberId, "a"),
      createLead(memberId, "b"),
      createLead(memberId, "c"),
      createLead(memberId, "d"),
      createLead(memberId, "e"),
    ]);

    await createAssignment({
      leadId: leads[0]!.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      week,
      source: "NEW_ACQUISITION",
      status: "TREATED",
      treatedAt,
    });
    await createAssignment({
      leadId: leads[1]!.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      week,
      source: "NEW_ACQUISITION",
      status: "ACTIVE",
    });
    await createAssignment({
      leadId: leads[2]!.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      week,
      source: "RECYCLED",
      status: "TREATED",
      treatedAt,
    });
    await createAssignment({
      leadId: leads[3]!.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      week,
      source: "MANUAL_ADMIN",
      status: "ACTIVE",
    });
    await createAssignment({
      leadId: leads[4]!.id,
      assigneeId: memberId,
      portfolioId: portfolio.id,
      week,
      source: "MANUAL_ADMIN",
      status: "RELEASED",
      releaseReason: RELEASE_REASON_ADMIN_REASSIGN,
    });

    const beforePortfolios = await prisma.weeklyPortfolio.count({
      where: { userId: memberId, weekStartAt: week.weekStartAt },
    });
    const kpis = await getOperatorWeeklyKpis({
      actorId: adminId,
      userId: memberId,
      now: WEEK_NOW,
    });
    const afterPortfolios = await prisma.weeklyPortfolio.count({
      where: { userId: memberId, weekStartAt: week.weekStartAt },
    });
    assert.equal(afterPortfolios, beforePortfolios);

    assert.equal(kpis.target, 5);
    assert.equal(kpis.assigned, 4);
    assert.equal(kpis.treated, 2);
    assert.equal(kpis.pending, 2);
    assert.equal(kpis.treatmentRate, 0.5);
    assert.equal(kpis.portfolioFillRate, 0.8);
    assert.equal(kpis.treatmentTargetRate, 0.4);
    assert.equal(kpis.bySource.newAcquisition, 2);
    assert.equal(kpis.bySource.recycled, 1);
    assert.equal(kpis.bySource.adminReassigned, 1);
    assert.equal(kpis.bySource.other, 1);
    assert.equal(kpis.released.weekClosed, 0);
    assert.equal(
      kpis.period.weekStartAt.toISOString(),
      week.weekStartAt.toISOString(),
    );
  });

  it("counts WEEK_CLOSED on the original week and not as pending", async () => {
    const portfolio = await createPortfolio(otherId, oldWeek, 3);
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 3,
    });
    const lead = await createLead(otherId, "week-closed");
    await createAssignment({
      leadId: lead.id,
      assigneeId: otherId,
      portfolioId: portfolio.id,
      week: oldWeek,
      source: "NEW_ACQUISITION",
      status: "RELEASED",
      releaseReason: RELEASE_REASON_WEEK_CLOSED,
    });

    const original = await getOperatorWeeklyKpis({
      actorId: otherId,
      userId: otherId,
      weekStartAt: oldWeek.weekStartAt,
      now: WEEK_NOW,
    });
    assert.equal(original.assigned, 1);
    assert.equal(original.pending, 0);
    assert.equal(original.treated, 0);
    assert.equal(original.released.weekClosed, 1);
    assert.equal(original.bySource.newAcquisition, 1);

    const current = await getOperatorWeeklyKpis({
      actorId: otherId,
      userId: otherId,
      now: WEEK_NOW,
    });
    assert.equal(current.released.weekClosed, 0);
    assert.equal(current.assigned, 0);
  });

  it("counts two valid cycles of the same lead as two assigned", async () => {
    const portfolio = await createPortfolio(otherId, week, 4);
    const lead = await createLead(otherId, "two-cycles");
    await createAssignment({
      leadId: lead.id,
      assigneeId: otherId,
      portfolioId: portfolio.id,
      week,
      source: "MANUAL_ADMIN",
      status: "RELEASED",
      releaseReason: RELEASE_REASON_RECYCLED,
      treatedAt: WEEK_NOW,
    });
    await createAssignment({
      leadId: lead.id,
      assigneeId: otherId,
      portfolioId: portfolio.id,
      week,
      source: "RECYCLED",
      status: "ACTIVE",
    });

    const kpis = await getOperatorWeeklyKpis({
      actorId: otherId,
      userId: otherId,
      now: WEEK_NOW,
    });
    assert.equal(kpis.assigned, 2);
    assert.equal(kpis.treated, 1);
    assert.equal(kpis.pending, 1);
    assert.equal(kpis.bySource.recycled, 1);
    assert.equal(kpis.bySource.other, 1);
  });

  it("keeps Sunday 23:59 SP in the same week and Monday 00:00 SP in the next", async () => {
    const sundayWeek = getOperationalWeek(SUNDAY_END);
    const mondayWeek = getOperationalWeek(MONDAY_START);
    assert.equal(
      sundayWeek.weekStartAt.toISOString(),
      week.weekStartAt.toISOString(),
    );
    assert.notEqual(
      mondayWeek.weekStartAt.toISOString(),
      week.weekStartAt.toISOString(),
    );

    const sundayKpis = await getOperatorWeeklyKpis({
      actorId: memberId,
      userId: memberId,
      now: SUNDAY_END,
    });
    const mondayKpis = await getOperatorWeeklyKpis({
      actorId: memberId,
      userId: memberId,
      now: MONDAY_START,
    });
    assert.equal(
      sundayKpis.period.weekStartAt.toISOString(),
      week.weekStartAt.toISOString(),
    );
    assert.equal(
      mondayKpis.period.weekStartAt.toISOString(),
      mondayWeek.weekStartAt.toISOString(),
    );
    assert.equal(mondayKpis.assigned, 0);
  });

  it("scopes operator A away from B and forbids MEMBER team view", async () => {
    const memberView = await getOperatorWeeklyKpis({
      actorId: memberId,
      userId: memberId,
      now: WEEK_NOW,
    });
    const otherView = await getOperatorWeeklyKpis({
      actorId: otherId,
      userId: otherId,
      now: WEEK_NOW,
    });
    assert.notEqual(memberView.assigned, otherView.assigned);

    await assert.rejects(
      () =>
        getOperatorWeeklyKpis({
          actorId: memberId,
          userId: otherId,
          now: WEEK_NOW,
        }),
      AuthorizationError,
    );
    await assert.rejects(
      () =>
        getCommercialWeeklyKpis({
          actorId: memberId,
          now: WEEK_NOW,
        }),
      AuthorizationError,
    );
  });

  it("aggregates ADMIN team KPIs from sums, not averaged rates", async () => {
    const extraLead = await createLead(otherId, "team-extra-pending");
    const otherPortfolio = await prisma.weeklyPortfolio.findUniqueOrThrow({
      where: {
        userId_weekStartAt: {
          userId: otherId,
          weekStartAt: week.weekStartAt,
        },
      },
    });
    await createAssignment({
      leadId: extraLead.id,
      assigneeId: otherId,
      portfolioId: otherPortfolio.id,
      week,
      source: "MANUAL_ADMIN",
      status: "ACTIVE",
    });

    const team = await getCommercialWeeklyKpis({
      actorId: adminId,
      now: WEEK_NOW,
    });
    const member = await getOperatorWeeklyKpis({
      actorId: adminId,
      userId: memberId,
      now: WEEK_NOW,
    });
    const other = await getOperatorWeeklyKpis({
      actorId: adminId,
      userId: otherId,
      now: WEEK_NOW,
    });

    assert.ok(team.operatorsTotal >= 2);
    assert.ok(team.operatorsWithQuota >= 2);
    assert.equal(team.assigned, member.assigned + other.assigned);
    assert.equal(team.treated, member.treated + other.treated);
    assert.equal(team.pending, member.pending + other.pending);
    assert.equal(team.treatmentRate, team.treated / team.assigned);
    assert.notEqual(
      team.treatmentRate,
      (member.treatmentRate + other.treatmentRate) / 2,
    );
  });
});
