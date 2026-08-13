import { prisma } from "@/lib/prisma";
import {
  DEFAULT_WEEKLY_TARGET,
  MAX_WEEKLY_TARGET,
  MIN_WEEKLY_TARGET,
  isValidTreatmentActivity,
} from "@/features/portfolio/portfolio.rules";
import {
  formatWeekRangePtBr,
  getOperationalWeek,
} from "@/features/portfolio/week";
import { resolveQualification } from "@/features/leads/intelligence/qualification";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { Prisma, type LeadAssignmentSource } from "@prisma/client";

export class PortfolioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioError";
  }
}

export type PortfolioSummary = {
  weekLabel: string;
  weekStartAt: Date;
  weekEndAt: Date;
  target: number;
  assigned: number;
  treated: number;
  pending: number;
  slotsRemaining: number;
  eligibleOperator: boolean;
};

function isHighIntelligence(intelligence: unknown): boolean {
  const parsed = parseLeadIntelligence(intelligence);
  if (!parsed) return false;
  return resolveQualification(parsed) === "HIGH";
}

export async function getWeeklyTargetForUser(userId: string): Promise<number> {
  const row = await prisma.operatorWeeklyQuota.findUnique({
    where: { userId },
    select: { weeklyTarget: true },
  });
  return row?.weeklyTarget ?? DEFAULT_WEEKLY_TARGET;
}

export async function setOperatorWeeklyQuota(input: {
  actorId: string;
  targetUserId: string;
  weeklyTarget: number;
}): Promise<{ userId: string; weeklyTarget: number }> {
  if (
    !Number.isInteger(input.weeklyTarget) ||
    input.weeklyTarget < MIN_WEEKLY_TARGET ||
    input.weeklyTarget > MAX_WEEKLY_TARGET
  ) {
    throw new PortfolioError(
      `Meta semanal deve ser um inteiro entre ${MIN_WEEKLY_TARGET} e ${MAX_WEEKLY_TARGET}.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: { id: true, role: true, isActive: true },
    });
    if (!actor?.isActive || actor.role !== "ADMIN") {
      throw new PortfolioError("Apenas administradores podem definir a meta.");
    }

    const target = await tx.user.findUnique({
      where: { id: input.targetUserId },
      select: { id: true, role: true, isActive: true, canRunAcquisition: true },
    });
    if (!target) {
      throw new PortfolioError("Usuário não encontrado.");
    }
    if (target.role === "MEMBER" && !target.canRunAcquisition) {
      throw new PortfolioError(
        "Autorize a aquisição do MEMBER antes de definir a meta semanal.",
      );
    }

    const quota = await tx.operatorWeeklyQuota.upsert({
      where: { userId: target.id },
      create: {
        userId: target.id,
        weeklyTarget: input.weeklyTarget,
        updatedById: actor.id,
      },
      update: {
        weeklyTarget: input.weeklyTarget,
        updatedById: actor.id,
      },
      select: { userId: true, weeklyTarget: true },
    });

    await tx.adminAuditEvent.create({
      data: {
        action: "user.weekly_quota.set",
        actorId: actor.id,
        targetUserId: target.id,
        detail: { weeklyTarget: quota.weeklyTarget },
      },
    });

    return quota;
  });
}

async function getOrCreatePortfolio(
  tx: Prisma.TransactionClient,
  userId: string,
  now = new Date(),
) {
  const week = getOperationalWeek(now);
  const target = await tx.operatorWeeklyQuota.findUnique({
    where: { userId },
    select: { weeklyTarget: true },
  });
  const targetSnapshot = target?.weeklyTarget ?? DEFAULT_WEEKLY_TARGET;

  const existing = await tx.weeklyPortfolio.findUnique({
    where: {
      userId_weekStartAt: { userId, weekStartAt: week.weekStartAt },
    },
  });
  if (existing) return existing;

  return tx.weeklyPortfolio.create({
    data: {
      userId,
      weekStartAt: week.weekStartAt,
      weekEndAt: week.weekEndAt,
      targetSnapshot,
    },
  });
}

export async function countAssignedTowardQuota(
  tx: Prisma.TransactionClient,
  portfolioId: string,
): Promise<number> {
  return tx.leadAssignment.count({
    where: {
      portfolioId,
      status: { in: ["ACTIVE", "TREATED"] },
    },
  });
}

export async function enrollOwnedHighLeadsIntoPortfolio(input: {
  userId: string;
  now?: Date;
}): Promise<{ enrolled: number; summary: PortfolioSummary }> {
  const now = input.now ?? new Date();
  let enrolled = 0;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        role: true,
        isActive: true,
        canRunAcquisition: true,
      },
    });
    if (!user?.isActive) {
      return;
    }
    const eligible =
      user.role === "ADMIN" ||
      (user.role === "MEMBER" && user.canRunAcquisition);
    if (!eligible) {
      return;
    }

    const portfolio = await getOrCreatePortfolio(tx, user.id, now);
    const assigned = await countAssignedTowardQuota(tx, portfolio.id);
    let slots = portfolio.targetSnapshot - assigned;
    if (slots <= 0) return;

    const owned = await tx.lead.findMany({
      where: {
        ownerId: user.id,
        stage: { notIn: ["WON", "LOST"] },
        NOT: { intelligence: { equals: Prisma.DbNull } },
        assignments: { none: { status: "ACTIVE" } },
      },
      select: { id: true, intelligence: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    for (const lead of owned) {
      if (slots <= 0) break;
      if (!isHighIntelligence(lead.intelligence)) continue;

      try {
        await tx.leadAssignment.create({
          data: {
            leadId: lead.id,
            assigneeId: user.id,
            portfolioId: portfolio.id,
            weekStartAt: portfolio.weekStartAt,
            source: "ENROLL_OWNED",
            status: "ACTIVE",
            dueAt: portfolio.weekEndAt,
          },
        });
        slots -= 1;
        enrolled += 1;
      } catch {
        // Unique ACTIVE race — skip
      }
    }
  });

  return {
    enrolled,
    summary: await getPortfolioSummaryForUser(input.userId, now),
  };
}

export async function getPortfolioSummaryForUser(
  userId: string,
  now = new Date(),
): Promise<PortfolioSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      canRunAcquisition: true,
    },
  });
  const eligibleOperator = Boolean(
    user?.isActive &&
      (user.role === "ADMIN" ||
        (user.role === "MEMBER" && user.canRunAcquisition)),
  );

  const week = getOperationalWeek(now);
  const portfolio = await prisma.weeklyPortfolio.findUnique({
    where: {
      userId_weekStartAt: { userId, weekStartAt: week.weekStartAt },
    },
  });

  const target =
    portfolio?.targetSnapshot ?? (await getWeeklyTargetForUser(userId));

  if (!portfolio) {
    return {
      weekLabel: formatWeekRangePtBr(week),
      weekStartAt: week.weekStartAt,
      weekEndAt: week.weekEndAt,
      target,
      assigned: 0,
      treated: 0,
      pending: 0,
      slotsRemaining: target,
      eligibleOperator,
    };
  }

  const [assignedActiveOrTreated, treated] = await Promise.all([
    prisma.leadAssignment.count({
      where: {
        portfolioId: portfolio.id,
        status: { in: ["ACTIVE", "TREATED"] },
      },
    }),
    prisma.leadAssignment.count({
      where: { portfolioId: portfolio.id, status: "TREATED" },
    }),
  ]);

  const pending = await prisma.leadAssignment.count({
    where: { portfolioId: portfolio.id, status: "ACTIVE" },
  });

  return {
    weekLabel: formatWeekRangePtBr(week),
    weekStartAt: portfolio.weekStartAt,
    weekEndAt: portfolio.weekEndAt,
    target: portfolio.targetSnapshot,
    assigned: assignedActiveOrTreated,
    treated,
    pending,
    slotsRemaining: Math.max(0, portfolio.targetSnapshot - assignedActiveOrTreated),
    eligibleOperator,
  };
}

export async function reassignLeadToOperator(input: {
  actorId: string;
  leadId: string;
  assigneeId: string;
  now?: Date;
}): Promise<{ assignmentId: string }> {
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: { id: true, role: true, isActive: true },
    });
    if (!actor?.isActive || actor.role !== "ADMIN") {
      throw new PortfolioError("Apenas administradores podem reatribuir leads.");
    }

    const assignee = await tx.user.findUnique({
      where: { id: input.assigneeId },
      select: {
        id: true,
        role: true,
        isActive: true,
        canRunAcquisition: true,
      },
    });
    if (!assignee?.isActive) {
      throw new PortfolioError("Destinatário inválido ou inativo.");
    }
    if (
      assignee.role === "MEMBER" &&
      !assignee.canRunAcquisition
    ) {
      throw new PortfolioError(
        "Destinatário MEMBER precisa estar autorizado para aquisição/carteira.",
      );
    }

    const lead = await tx.lead.findUnique({
      where: { id: input.leadId },
      select: { id: true, ownerId: true, intelligence: true, stage: true },
    });
    if (!lead) {
      throw new PortfolioError("Lead não encontrado.");
    }
    if (!isHighIntelligence(lead.intelligence)) {
      throw new PortfolioError("Somente leads HIGH entram na carteira semanal.");
    }

    const previousAssigneeId = lead.ownerId;
    const active = await tx.leadAssignment.findFirst({
      where: { leadId: lead.id, status: "ACTIVE" },
    });
    if (active) {
      await tx.leadAssignment.update({
        where: { id: active.id },
        data: {
          status: "RELEASED",
          releasedAt: now,
          releaseReason: "ADMIN_REASSIGN",
        },
      });
    }

    const portfolio = await getOrCreatePortfolio(tx, assignee.id, now);
    const assigned = await countAssignedTowardQuota(tx, portfolio.id);
    if (assigned >= portfolio.targetSnapshot) {
      throw new PortfolioError(
        "O operador já atingiu a meta semanal de atribuições.",
      );
    }

    await tx.lead.update({
      where: { id: lead.id },
      data: { ownerId: assignee.id },
    });

    const created = await tx.leadAssignment.create({
      data: {
        leadId: lead.id,
        assigneeId: assignee.id,
        portfolioId: portfolio.id,
        weekStartAt: portfolio.weekStartAt,
        source: "MANUAL_ADMIN" satisfies LeadAssignmentSource,
        status: "ACTIVE",
        dueAt: portfolio.weekEndAt,
        previousAssigneeId:
          previousAssigneeId !== assignee.id ? previousAssigneeId : null,
      },
      select: { id: true },
    });

    await tx.adminAuditEvent.create({
      data: {
        action: "lead.reassign",
        actorId: actor.id,
        targetUserId: assignee.id,
        detail: {
          leadId: lead.id,
          previousAssigneeId,
          assignmentId: created.id,
        },
      },
    });

    return { assignmentId: created.id };
  });
}

export async function listAssignableOperators(): Promise<
  Array<{ id: string; name: string; email: string; role: string }>
> {
  return prisma.user.findMany({
    where: {
      isActive: true,
      OR: [{ role: "ADMIN" }, { role: "MEMBER", canRunAcquisition: true }],
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function markAssignmentTreatedFromActivity(input: {
  leadId: string;
  activityId: string;
  authorId: string;
  type: string;
  outcome: string | null | undefined;
  activityCreatedAt: Date;
}): Promise<boolean> {
  const active = await prisma.leadAssignment.findFirst({
    where: { leadId: input.leadId, status: "ACTIVE" },
  });
  if (!active) return false;

  if (
    !isValidTreatmentActivity({
      type: input.type as "WHATSAPP" | "EMAIL" | "NOTE" | "STAGE_CHANGE",
      outcome: input.outcome as never,
      activityCreatedAt: input.activityCreatedAt,
      assignedAt: active.assignedAt,
      authorId: input.authorId,
      assigneeId: active.assigneeId,
    })
  ) {
    return false;
  }

  await prisma.leadAssignment.update({
    where: { id: active.id },
    data: {
      status: "TREATED",
      treatedAt: input.activityCreatedAt,
      treatedActivityId: input.activityId,
    },
  });
  return true;
}
