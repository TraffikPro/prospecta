import { prisma } from "@/lib/prisma";
import {
  HIGH_ASSIGNMENT_CAP,
  MAX_WEEKLY_TARGET,
  MIN_WEEKLY_TARGET,
  RELEASE_REASON_ADMIN_REASSIGN,
  RELEASE_REASON_RECYCLED,
  classifyHighPoolLead,
  countCommercialCycles,
  isHighQualification,
  isTerminalLeadStage,
  isValidTreatmentActivity,
} from "@/features/portfolio/portfolio.rules";
import {
  formatWeekRangePtBr,
  getOperationalWeek,
} from "@/features/portfolio/week";
import { Prisma, type LeadAssignmentSource, type LeadStage } from "@prisma/client";

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
  return assignLeadToOperatorInternal({
    ...input,
    mode: "admin",
  });
}

/**
 * F3 wallet fill: assign a returned lead to the requesting operator.
 * Never steals another operator's ACTIVE. Source is always NEW_ACQUISITION.
 */
export async function assignLeadFromWalletFill(input: {
  actorId: string;
  leadId: string;
  now?: Date;
}): Promise<{ assignmentId: string; idempotent: boolean }> {
  return assignLeadToOperatorInternal({
    actorId: input.actorId,
    leadId: input.leadId,
    assigneeId: input.actorId,
    mode: "wallet-fill",
    now: input.now,
  });
}

/**
 * Assigns returned internal lead IDs to the job requester, re-checking remaining
 * before each assignment. Skips ineligible IDs. Does not fail the job on skips.
 */
export async function assignWalletFillLeads(input: {
  requestedById: string;
  leadIds: string[];
  requestedSlots: number;
  now?: Date;
}): Promise<{ assignedCount: number; remainingSlots: number }> {
  const now = input.now ?? new Date();
  const uniqueIds = [...new Set(input.leadIds.filter((id) => id.trim()))];
  let assignedCount = 0;

  for (const leadId of uniqueIds) {
    const summary = await getPortfolioSummaryForUser(input.requestedById, now);
    if (!summary.quotaConfigured || summary.slotsRemaining <= 0) {
      break;
    }
    if (assignedCount >= input.requestedSlots) {
      break;
    }
    try {
      const result = await assignLeadFromWalletFill({
        actorId: input.requestedById,
        leadId,
        now,
      });
      if (!result.idempotent) {
        assignedCount += 1;
      }
    } catch (error) {
      if (error instanceof PortfolioError) {
        continue;
      }
      throw error;
    }
  }

  const after = await getPortfolioSummaryForUser(input.requestedById, now);
  return {
    assignedCount,
    remainingSlots: after.slotsRemaining,
  };
}

async function assignLeadToOperatorInternal(input: {
  actorId: string;
  leadId: string;
  assigneeId: string;
  expectedActiveAssigneeId?: string | null;
  now?: Date;
  mode: "admin" | "wallet-fill";
}): Promise<{ assignmentId: string; idempotent: boolean }> {
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: {
        id: true,
        role: true,
        isActive: true,
        canRunAcquisition: true,
      },
    });
    if (!actor?.isActive) {
      throw new PortfolioError("Operador inválido ou inativo.");
    }
    if (input.mode === "admin") {
      if (actor.role !== "ADMIN") {
        throw new PortfolioError(
          "Apenas administradores podem reatribuir leads.",
        );
      }
    } else {
      if (actor.id !== input.assigneeId) {
        throw new PortfolioError(
          "Só é possível completar a carteira do próprio operador.",
        );
      }
      if (actor.role === "MEMBER" && !actor.canRunAcquisition) {
        throw new PortfolioError(
          "Operador MEMBER precisa estar autorizado para aquisição/carteira.",
        );
      }
      if (actor.role !== "ADMIN" && actor.role !== "MEMBER") {
        throw new PortfolioError("Operador sem permissão para completar carteira.");
      }
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
    if (!isHighQualification(lead.intelligence)) {
      throw new PortfolioError("Somente leads HIGH entram na carteira semanal.");
    }

    const portfolio = await getOrCreatePortfolio(tx, assignee.id, now);

    const assignments = await tx.leadAssignment.findMany({
      where: { leadId: lead.id },
      select: {
        id: true,
        status: true,
        releaseReason: true,
        assigneeId: true,
        portfolioId: true,
      },
    });
    const active =
      assignments.find((row) => row.status === "ACTIVE") ?? null;

    if (!active) {
      if (isTerminalLeadStage(lead.stage)) {
        throw new PortfolioError(
          "Leads ganhos ou perdidos não entram na carteira semanal.",
        );
      }
      if (countCommercialCycles(assignments) >= HIGH_ASSIGNMENT_CAP) {
        throw new PortfolioError(
          "Este lead já atingiu o limite de 2 ciclos comerciais.",
        );
      }
      if (assignments.some((row) => row.status === "TREATED")) {
        throw new PortfolioError(
          "Recicle o lead antes de atribuir novamente.",
        );
      }
    }

    if (
      active &&
      active.assigneeId === assignee.id &&
      active.portfolioId === portfolio.id
    ) {
      return { assignmentId: active.id, idempotent: true };
    }

    if (active && active.assigneeId !== assignee.id) {
      if (input.mode === "wallet-fill") {
        throw new PortfolioError(
          "Este lead já possui atribuição ativa.",
        );
      }
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
          releaseReason: RELEASE_REASON_ADMIN_REASSIGN,
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

    const assignmentSource: LeadAssignmentSource =
      input.mode === "wallet-fill"
        ? "NEW_ACQUISITION"
        : assignments.some(
              (row) => row.releaseReason === RELEASE_REASON_RECYCLED,
            )
          ? "RECYCLED"
          : "MANUAL_ADMIN";

    let created: { id: string };
    try {
      created = await tx.leadAssignment.create({
        data: {
          leadId: lead.id,
          assigneeId: assignee.id,
          assignedById: actor.id,
          portfolioId: portfolio.id,
          weekStartAt: portfolio.weekStartAt,
          source: assignmentSource,
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
        action:
          input.mode === "wallet-fill" ? "lead.fill_assign" : "lead.reassign",
        actorId: actor.id,
        targetUserId: assignee.id,
        detail: {
          leadId: lead.id,
          previousAssigneeId,
          assignmentId: created.id,
          assignedById: actor.id,
          source: assignmentSource,
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

export type HighPoolReviewItem = {
  id: string;
  companyName: string;
  stage: LeadStage;
  cycles: number;
  ownerName: string | null;
  operatorName: string | null;
};

export type HighPoolReview = {
  eligible: HighPoolReviewItem[];
  assigned: HighPoolReviewItem[];
  recyclable: HighPoolReviewItem[];
  capped: HighPoolReviewItem[];
};

/**
 * ADMIN-only recycle: TREATED → RELEASED/RECYCLED. Revalidates under Lead lock.
 * TREATED never returns to the pool by itself.
 */
export async function recycleLeadToPool(input: {
  actorId: string;
  leadId: string;
  now?: Date;
}): Promise<{ assignmentId: string }> {
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: { id: true, role: true, isActive: true },
    });
    if (!actor?.isActive || actor.role !== "ADMIN") {
      throw new PortfolioError("Apenas administradores podem reciclar leads.");
    }

    const lockedLeads = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Lead" WHERE id = ${input.leadId} FOR UPDATE
    `;
    if (lockedLeads.length === 0) {
      throw new PortfolioError("Lead não encontrado.");
    }

    const lead = await tx.lead.findUnique({
      where: { id: input.leadId },
      select: { id: true, intelligence: true, stage: true },
    });
    if (!lead) {
      throw new PortfolioError("Lead não encontrado.");
    }

    const assignments = await tx.leadAssignment.findMany({
      where: { leadId: lead.id },
      orderBy: { assignedAt: "desc" },
    });
    const treated = assignments.filter((row) => row.status === "TREATED");
    const hasActive = assignments.some((row) => row.status === "ACTIVE");

    if (treated.length === 0) {
      throw new PortfolioError(
        "Somente leads tratados podem ser reciclados.",
      );
    }
    if (treated.length !== 1) {
      throw new PortfolioError(
        "Estado de atribuição inconsistente. Recarregue e tente novamente.",
      );
    }
    if (hasActive) {
      throw new PortfolioError("Este lead já possui atribuição ativa.");
    }
    if (isTerminalLeadStage(lead.stage)) {
      throw new PortfolioError(
        "Leads ganhos ou perdidos não voltam ao pool.",
      );
    }
    if (!isHighQualification(lead.intelligence)) {
      throw new PortfolioError("Somente leads HIGH voltam ao pool.");
    }
    if (countCommercialCycles(assignments) >= HIGH_ASSIGNMENT_CAP) {
      throw new PortfolioError(
        "Este lead já atingiu o limite de 2 ciclos comerciais.",
      );
    }

    const treatedRow = treated[0]!;
    await tx.leadAssignment.update({
      where: { id: treatedRow.id },
      data: {
        status: "RELEASED",
        releasedAt: now,
        releaseReason: RELEASE_REASON_RECYCLED,
      },
    });

    await tx.adminAuditEvent.create({
      data: {
        action: "lead.recycle",
        actorId: actor.id,
        targetUserId: treatedRow.assigneeId,
        detail: {
          leadId: lead.id,
          assignmentId: treatedRow.id,
          previousAssigneeId: treatedRow.assigneeId,
        },
      },
    });

    return { assignmentId: treatedRow.id };
  });
}

export async function listHighPoolReview(actorId: string): Promise<HighPoolReview> {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, role: true, isActive: true },
  });
  if (!actor?.isActive || actor.role !== "ADMIN") {
    throw new PortfolioError(
      "Apenas administradores podem revisar o pool HIGH.",
    );
  }

  const leads = await prisma.lead.findMany({
    select: {
      id: true,
      companyName: true,
      stage: true,
      intelligence: true,
      owner: { select: { name: true } },
      assignments: {
        select: {
          status: true,
          releaseReason: true,
          assignee: { select: { name: true } },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
    orderBy: { companyName: "asc" },
  });

  const review: HighPoolReview = {
    eligible: [],
    assigned: [],
    recyclable: [],
    capped: [],
  };

  for (const lead of leads) {
    const bucket = classifyHighPoolLead({
      intelligence: lead.intelligence,
      stage: lead.stage,
      assignments: lead.assignments,
    });
    if (!bucket) continue;

    const active = lead.assignments.find((row) => row.status === "ACTIVE");
    const treated = lead.assignments.find((row) => row.status === "TREATED");
    const item: HighPoolReviewItem = {
      id: lead.id,
      companyName: lead.companyName,
      stage: lead.stage,
      cycles: countCommercialCycles(lead.assignments),
      ownerName: lead.owner?.name ?? null,
      operatorName:
        active?.assignee.name ?? treated?.assignee.name ?? lead.owner?.name ?? null,
    };
    review[bucket].push(item);
  }

  return review;
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
