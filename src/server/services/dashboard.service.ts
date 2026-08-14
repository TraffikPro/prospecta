import { prisma } from "@/lib/prisma";
import { AuthorizationError } from "@/server/auth/errors";
import {
  getCommercialWeeklyKpis,
  getOperatorWeeklyKpis,
  type CommercialTeamKpis,
  type WeeklyCommercialKpis,
} from "./commercial-kpi.service";

export type OperationalDashboard =
  | { kind: "operator"; kpis: WeeklyCommercialKpis }
  | { kind: "team"; kpis: CommercialTeamKpis };

/**
 * Read-only weekly overview for `/app`.
 * Role comes from the database — never from a query string or the client.
 */
export async function getOperationalDashboard(input: {
  actorId: string;
  now?: Date;
}): Promise<OperationalDashboard> {
  const actor = await prisma.user.findUnique({
    where: { id: input.actorId },
    select: { id: true, role: true, isActive: true },
  });
  if (!actor?.isActive) {
    throw new AuthorizationError();
  }

  if (actor.role === "ADMIN") {
    return {
      kind: "team",
      kpis: await getCommercialWeeklyKpis({
        actorId: actor.id,
        now: input.now,
      }),
    };
  }

  if (actor.role === "MEMBER") {
    return {
      kind: "operator",
      kpis: await getOperatorWeeklyKpis({
        actorId: actor.id,
        userId: actor.id,
        now: input.now,
      }),
    };
  }

  throw new AuthorizationError();
}
