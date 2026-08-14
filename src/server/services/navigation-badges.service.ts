import { prisma } from "@/lib/prisma";
import { AuthorizationError } from "@/server/auth/errors";
import { getOperatorWeeklyKpis } from "@/server/services/commercial-kpi.service";
import { countRecyclableHighPool } from "@/server/services/portfolio.service";

export type NavigationBadges = {
  myQueue: number;
  highReview?: number;
};

/**
 * Request-time action badges for the commercial shell.
 * Composes canonical KPI + F2 recyclable count. No new commercial rule.
 */
export async function getNavigationBadges(input: {
  actorId: string;
  now?: Date;
}): Promise<NavigationBadges> {
  const actor = await prisma.user.findUnique({
    where: { id: input.actorId },
    select: { id: true, role: true, isActive: true },
  });
  if (!actor?.isActive) {
    throw new AuthorizationError();
  }

  const kpis = await getOperatorWeeklyKpis({
    actorId: actor.id,
    userId: actor.id,
    now: input.now,
  });

  const badges: NavigationBadges = {
    myQueue: kpis.pending,
  };

  if (actor.role === "ADMIN") {
    badges.highReview = await countRecyclableHighPool(actor.id);
  }

  return badges;
}
