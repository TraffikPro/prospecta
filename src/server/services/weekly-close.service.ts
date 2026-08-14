import { RELEASE_REASON_WEEK_CLOSED } from "@/features/portfolio/portfolio.rules";
import {
  getOperationalWeek,
  isOperationalWeekExpired,
} from "@/features/portfolio/week";
import { prisma } from "@/lib/prisma";

export type WeeklyCloseResult = {
  portfoliosProcessed: number;
  assignmentsReleased: number;
  alreadyClosed: number;
  errors: number;
};

async function closeOneExpiredPortfolio(
  portfolioId: string,
  userId: string,
  now: Date,
): Promise<{ released: number }> {
  return prisma.$transaction(async (tx) => {
    const active = await tx.leadAssignment.findMany({
      where: { portfolioId, status: "ACTIVE" },
      select: { leadId: true },
      orderBy: { leadId: "asc" },
    });

    const leadIds = [...new Set(active.map((row) => row.leadId))].sort();
    for (const leadId of leadIds) {
      await tx.$queryRaw`
        SELECT id FROM "Lead" WHERE id = ${leadId} FOR UPDATE
      `;
    }

    await tx.$queryRaw`
      SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT id FROM "WeeklyPortfolio" WHERE id = ${portfolioId} FOR UPDATE
    `;

    const updated = await tx.leadAssignment.updateMany({
      where: { portfolioId, status: "ACTIVE" },
      data: {
        status: "RELEASED",
        releasedAt: now,
        releaseReason: RELEASE_REASON_WEEK_CLOSED,
      },
    });

    return { released: updated.count };
  });
}

/**
 * Closes expired operational weeks (`weekEndAt < now`).
 * ACTIVE → RELEASED / WEEK_CLOSED. TREATED and existing RELEASED stay as-is.
 * Idempotent: a second run does not rewrite `releasedAt` or duplicate work.
 */
export async function closeExpiredWeeklyPortfolios(
  now = new Date(),
): Promise<WeeklyCloseResult> {
  const currentWeek = getOperationalWeek(now);

  const expired = await prisma.weeklyPortfolio.findMany({
    where: {
      weekEndAt: { lt: now },
      weekStartAt: { lt: currentWeek.weekStartAt },
    },
    select: { id: true, userId: true, weekEndAt: true },
    orderBy: { weekStartAt: "asc" },
  });

  const result: WeeklyCloseResult = {
    portfoliosProcessed: 0,
    assignmentsReleased: 0,
    alreadyClosed: 0,
    errors: 0,
  };

  for (const portfolio of expired) {
    if (!isOperationalWeekExpired(portfolio.weekEndAt, now)) {
      continue;
    }
    result.portfoliosProcessed += 1;
    try {
      const { released } = await closeOneExpiredPortfolio(
        portfolio.id,
        portfolio.userId,
        now,
      );
      if (released === 0) {
        result.alreadyClosed += 1;
      } else {
        result.assignmentsReleased += released;
      }
    } catch {
      result.errors += 1;
    }
  }

  return result;
}
