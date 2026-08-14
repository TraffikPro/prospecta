import {
  aggregateWeeklyAssignmentKpis,
  emptyAssignmentKpiCounts,
  safeRate,
  type WeeklyAssignmentKpiCounts,
} from "@/features/portfolio/kpi.rules";
import {
  getOperationalWeek,
  isSameWeekStart,
  type OperationalWeek,
} from "@/features/portfolio/week";
import { prisma } from "@/lib/prisma";
import { AuthorizationError } from "@/server/auth/errors";

export type WeeklyCommercialKpis = {
  period: {
    weekStartAt: Date;
    weekEndAt: Date;
  };
  quotaConfigured: boolean;
  target: number;
  assigned: number;
  treated: number;
  pending: number;
  treatmentRate: number;
  portfolioFillRate: number;
  treatmentTargetRate: number;
  bySource: WeeklyAssignmentKpiCounts["bySource"];
  released: {
    weekClosed: number;
  };
};

export type CommercialTeamKpis = {
  period: {
    weekStartAt: Date;
    weekEndAt: Date;
  };
  operatorsTotal: number;
  operatorsWithQuota: number;
  quotaConfigured: boolean;
  target: number;
  assigned: number;
  treated: number;
  pending: number;
  treatmentRate: number;
  portfolioFillRate: number;
  treatmentTargetRate: number;
  bySource: WeeklyAssignmentKpiCounts["bySource"];
  released: {
    weekClosed: number;
  };
};

function resolveKpiWeek(input?: { now?: Date; weekStartAt?: Date }): OperationalWeek {
  if (input?.weekStartAt) {
    return getOperationalWeek(input.weekStartAt);
  }
  return getOperationalWeek(input?.now ?? new Date());
}

function withRates(
  period: OperationalWeek,
  quotaConfigured: boolean,
  target: number,
  counts: WeeklyAssignmentKpiCounts,
): WeeklyCommercialKpis {
  return {
    period: {
      weekStartAt: period.weekStartAt,
      weekEndAt: period.weekEndAt,
    },
    quotaConfigured,
    target,
    assigned: counts.assigned,
    treated: counts.treated,
    pending: counts.pending,
    treatmentRate: safeRate(counts.treated, counts.assigned),
    portfolioFillRate: safeRate(counts.assigned, target),
    treatmentTargetRate: safeRate(counts.treated, target),
    bySource: counts.bySource,
    released: counts.released,
  };
}

async function requireActor(actorId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, isActive: true },
  });
  if (!actor?.isActive) {
    throw new AuthorizationError();
  }
  return actor;
}

/**
 * Read-only weekly KPIs for one operator.
 * MEMBER may only read self. ADMIN may read any operator.
 */
export async function getOperatorWeeklyKpis(input: {
  actorId: string;
  userId: string;
  now?: Date;
  weekStartAt?: Date;
}): Promise<WeeklyCommercialKpis> {
  const actor = await requireActor(input.actorId);
  if (actor.role !== "ADMIN" && actor.id !== input.userId) {
    throw new AuthorizationError();
  }

  const week = resolveKpiWeek(input);
  const isCurrentWeek = isSameWeekStart(
    week.weekStartAt,
    getOperationalWeek(input.now ?? new Date()).weekStartAt,
  );

  const [quota, portfolio, rows] = await Promise.all([
    prisma.operatorWeeklyQuota.findUnique({
      where: { userId: input.userId },
      select: { weeklyTarget: true },
    }),
    prisma.weeklyPortfolio.findUnique({
      where: {
        userId_weekStartAt: {
          userId: input.userId,
          weekStartAt: week.weekStartAt,
        },
      },
      select: { id: true, targetSnapshot: true },
    }),
    prisma.leadAssignment.findMany({
      where: { assigneeId: input.userId, weekStartAt: week.weekStartAt },
      select: {
        status: true,
        source: true,
        releaseReason: true,
        treatedAt: true,
      },
    }),
  ]);

  const quotaConfigured = Boolean(portfolio) || (isCurrentWeek && Boolean(quota));
  const target = portfolio
    ? portfolio.targetSnapshot
    : isCurrentWeek && quota
      ? quota.weeklyTarget
      : 0;

  return withRates(
    week,
    quotaConfigured,
    target,
    aggregateWeeklyAssignmentKpis(rows),
  );
}

/**
 * Read-only team KPIs. ADMIN only.
 * Rates use sums, never the average of per-operator rates.
 */
export async function getCommercialWeeklyKpis(input: {
  actorId: string;
  now?: Date;
  weekStartAt?: Date;
}): Promise<CommercialTeamKpis> {
  const actor = await requireActor(input.actorId);
  if (actor.role !== "ADMIN") {
    throw new AuthorizationError();
  }

  const week = resolveKpiWeek(input);
  const isCurrentWeek = isSameWeekStart(
    week.weekStartAt,
    getOperationalWeek(input.now ?? new Date()).weekStartAt,
  );

  const operators = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [{ role: "ADMIN" }, { role: "MEMBER", canRunAcquisition: true }],
    },
    select: { id: true },
  });
  const operatorIds = operators.map((row) => row.id);

  const [quotas, portfolios, rows] = await Promise.all([
    operatorIds.length === 0
      ? Promise.resolve([])
      : prisma.operatorWeeklyQuota.findMany({
          where: { userId: { in: operatorIds } },
          select: { userId: true, weeklyTarget: true },
        }),
    operatorIds.length === 0
      ? Promise.resolve([])
      : prisma.weeklyPortfolio.findMany({
          where: {
            userId: { in: operatorIds },
            weekStartAt: week.weekStartAt,
          },
          select: { userId: true, targetSnapshot: true },
        }),
    prisma.leadAssignment.findMany({
      where: {
        weekStartAt: week.weekStartAt,
        ...(operatorIds.length > 0
          ? { assigneeId: { in: operatorIds } }
          : { assigneeId: { in: [] } }),
      },
      select: {
        status: true,
        source: true,
        releaseReason: true,
        treatedAt: true,
      },
    }),
  ]);

  const quotaByUser = new Map(quotas.map((row) => [row.userId, row.weeklyTarget]));
  const portfolioByUser = new Map(
    portfolios.map((row) => [row.userId, row.targetSnapshot]),
  );

  let target = 0;
  let operatorsWithQuota = 0;
  for (const id of operatorIds) {
    const snapshot = portfolioByUser.get(id);
    const live = quotaByUser.get(id);
    if (snapshot != null) {
      operatorsWithQuota += 1;
      target += snapshot;
    } else if (isCurrentWeek && live != null) {
      operatorsWithQuota += 1;
      target += live;
    }
  }

  const counts =
    operatorIds.length === 0
      ? emptyAssignmentKpiCounts()
      : aggregateWeeklyAssignmentKpis(rows);

  const operatorView = withRates(
    week,
    operatorsWithQuota > 0,
    target,
    counts,
  );

  return {
    period: operatorView.period,
    operatorsTotal: operatorIds.length,
    operatorsWithQuota,
    quotaConfigured: operatorView.quotaConfigured,
    target: operatorView.target,
    assigned: operatorView.assigned,
    treated: operatorView.treated,
    pending: operatorView.pending,
    treatmentRate: operatorView.treatmentRate,
    portfolioFillRate: operatorView.portfolioFillRate,
    treatmentTargetRate: operatorView.treatmentTargetRate,
    bySource: operatorView.bySource,
    released: operatorView.released,
  };
}
