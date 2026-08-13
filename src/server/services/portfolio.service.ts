import { prisma } from "@/lib/prisma";
import {
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
  /** False when OperatorWeeklyQuota is missing — no portfolio / no slots. */
  quotaConfigured: boolean;
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

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function getConfiguredWeeklyTarget(
  userId: string,
): Promise<number | null> {
  const row = await prisma.operatorWeeklyQuota.findUnique({
    where: { userId },
    select: { weeklyTarget: true },
  });
  return row?.weeklyTarget ?? null;
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
    if (!target.isActive) {
      throw new PortfolioError(
        "Não é possível definir meta para usuário inativo.",
      );
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

/**
 * Requires OperatorWeeklyQuota. Serializes on User row so concurrent
 * get-or-create of the same WeeklyPortfolio is idempotent without catching
 * SQL errors inside an aborted PostgreSQL transaction.
 */
async function getOrCreatePortfolio(
  tx: Prisma.TransactionClient,
  userId: string,
  now = new Date(),
) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;

  const week = getOperationalWeek(now);
  const quota = await tx.operatorWeeklyQuota.findUnique({
    where: { userId },
    select: { weeklyTarget: true },
  });
  if (!quota) {
    throw new PortfolioError("Meta semanal ainda não configurada.");
  }

  const existing = await tx.weeklyPortfolio.findUnique({
    where: {
      userId_weekStartAt: { userId, weekStartAt: week.weekStartAt },
    },
  });
  if (existing) {
    await tx.$queryRaw`SELECT id FROM "WeeklyPortfolio" WHERE id = ${existing.id} FOR UPDATE`;
    return existing;
  }

  try {
    return await tx.weeklyPortfolio.create({
      data: {
        userId,
        weekStartAt: week.weekStartAt,
        weekEndAt: week.weekEndAt,
        targetSnapshot: quota.weeklyTarget,
      },
    });
  } catch (error) {
    // Only expected race: unique (userId, weekStartAt). User row lock should
    // prevent this; if it still happens, surface clearly (do not continue on
    // an aborted transaction).
    if (isUniqueViolation(error)) {
      throw new PortfolioError(
        "Conflito ao criar a carteira semanal. Tente novamente.",
      );
    }
    throw error;
  }
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
  const quota = await prisma.operatorWeeklyQuota.findUnique({
    where: { userId },
    select: { weeklyTarget: true },
  });

  if (!quota) {
    return {
      weekLabel: formatWeekRangePtBr(week),
      weekStartAt: week.weekStartAt,
      weekEndAt: week.weekEndAt,
      quotaConfigured: false,
      target: 0,
      assigned: 0,
      treated: 0,
      pending: 0,
      slotsRemaining: 0,
      eligibleOperator,
    };
  }

  const portfolio = await prisma.weeklyPortfolio.findUnique({
    where: {
      userId_weekStartAt: { userId, weekStartAt: week.weekStartAt },
    },
  });

  if (!portfolio) {
    return {
      weekLabel: formatWeekRangePtBr(week),
      weekStartAt: week.weekStartAt,
      weekEndAt: week.weekEndAt,
      quotaConfigured: true,
      target: quota.weeklyTarget,
      assigned: 0,
      treated: 0,
      pending: 0,
      slotsRemaining: quota.weeklyTarget,
      eligibleOperator,
    };
  }

  const [assignedActiveOrTreated, treated, pending] = await Promise.all([
    prisma.leadAssignment.count({
      where: {
        portfolioId: portfolio.id,
        status: { in: ["ACTIVE", "TREATED"] },
      },
    }),
    prisma.leadAssignment.count({
      where: { portfolioId: portfolio.id, status: "TREATED" },
    }),
    prisma.leadAssignment.count({
      where: { portfolioId: portfolio.id, status: "ACTIVE" },
    }),
  ]);

  return {
    weekLabel: formatWeekRangePtBr(week),
    weekStartAt: portfolio.weekStartAt,
    weekEndAt: portfolio.weekEndAt,
    quotaConfigured: true,
    target: portfolio.targetSnapshot,
    assigned: assignedActiveOrTreated,
    treated,
    pending,
    slotsRemaining: Math.max(
      0,
      portfolio.targetSnapshot - assignedActiveOrTreated,
    ),
    eligibleOperator,
  };
}

export async function reassignLeadToOperator(input: {
  actorId: string;
  leadId: string;
  assigneeId: string;
  /**
   * Snapshot of who currently holds the ACTIVE assignment (or lead owner when
   * the form loaded). Required to change an existing ACTIVE assignee; concurrent
   * conflicting targets get a conflict instead of silent last-write-wins.
   */
  expectedActiveAssigneeId?: string | null;
  now?: Date;
}): Promise<{ assignmentId: string; idempotent: boolean }> {
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: { id: true, role: true, isActive: true },
    });
    if (!actor?.isActive || actor.role !== "ADMIN") {
      throw new PortfolioError("Apenas administradores podem reatribuir leads.");
    }

    // Lock order: Lead → User(assignee) to avoid deadlocks and serialize
    // same-lead + last-slot races.
    const lockedLeads = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Lead" WHERE id = ${input.leadId} FOR UPDATE
    `;
    if (lockedLeads.length === 0) {
      throw new PortfolioError("Lead não encontrado.");
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
    if (assignee.role === "MEMBER" && !assignee.canRunAcquisition) {
      throw new PortfolioError(
        "Destinatário MEMBER precisa estar autorizado para aquisição/carteira.",
      );
    }

    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${assignee.id} FOR UPDATE`;

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

    const portfolio = await getOrCreatePortfolio(tx, assignee.id, now);

    const active = await tx.leadAssignment.findFirst({
      where: { leadId: lead.id, status: "ACTIVE" },
    });

    if (
      active &&
      active.assigneeId === assignee.id &&
      active.portfolioId === portfolio.id
    ) {
      return { assignmentId: active.id, idempotent: true };
    }

    if (active && active.assigneeId !== assignee.id) {
      const expected = input.expectedActiveAssigneeId ?? null;
      if (expected !== active.assigneeId) {
        throw new PortfolioError(
          "Lead já atribuído a outro operador. Recarregue o estado e reatribua explicitamente.",
        );
      }
      await tx.leadAssignment.update({
        where: { id: active.id },
        data: {
          status: "RELEASED",
          releasedAt: now,
          releaseReason: "ADMIN_REASSIGN",
        },
      });
    }

    const previousAssigneeId = active?.assigneeId ?? lead.ownerId;
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

    let created: { id: string };
    try {
      created = await tx.leadAssignment.create({
        data: {
          leadId: lead.id,
          assigneeId: assignee.id,
          assignedById: actor.id,
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
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new PortfolioError(
          "Este lead já possui atribuição ativa. Tente novamente.",
        );
      }
      throw error;
    }

    await tx.adminAuditEvent.create({
      data: {
        action: "lead.reassign",
        actorId: actor.id,
        targetUserId: assignee.id,
        detail: {
          leadId: lead.id,
          previousAssigneeId,
          assignmentId: created.id,
          assignedById: actor.id,
        },
      },
    });

    return { assignmentId: created.id, idempotent: false };
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

/**
 * Marks ACTIVE assignment as TREATED inside the caller's transaction.
 * When the activity is a valid treatment, update must succeed or the whole
 * transaction should abort (caller throws).
 */
export async function markAssignmentTreatedInTx(
  tx: Prisma.TransactionClient,
  input: {
    leadId: string;
    activityId: string;
    authorId: string;
    type: string;
    outcome: string | null | undefined;
    activityCreatedAt: Date;
  },
): Promise<boolean> {
  const active = await tx.leadAssignment.findFirst({
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

  const updated = await tx.leadAssignment.updateMany({
    where: { id: active.id, status: "ACTIVE" },
    data: {
      status: "TREATED",
      treatedAt: input.activityCreatedAt,
      treatedActivityId: input.activityId,
    },
  });

  if (updated.count !== 1) {
    throw new PortfolioError(
      "Não foi possível marcar o tratamento na carteira.",
    );
  }

  return true;
}
