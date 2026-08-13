import {
  ACQUISITION_JOB_TIMEOUT_MS,
  getWalletFillSearchConfig,
  walletFillBatchSize,
  walletFillFingerprint,
} from "@/features/acquisition/acquisition.schema";
import { getOperationalWeek } from "@/features/portfolio/week";
import { prisma } from "@/lib/prisma";
import {
  createAcquisitionJobAtomic,
  findActiveWalletFillJob,
  findLatestWalletFillJob,
} from "@/server/repositories/acquisition-job.repository";
import {
  AcquisitionDispatchError,
  dispatchJobToRunner,
  updateFailedDispatch,
} from "@/server/services/acquisition-job.service";
import {
  PortfolioError,
  getPortfolioSummaryForUser,
} from "@/server/services/portfolio.service";

export type WalletFillStatus = {
  available: boolean;
  reason:
    | "ineligible"
    | "no_quota"
    | "complete"
    | "running"
    | "ready";
  slotsRemaining: number;
  activeJobId: string | null;
  lastJob: {
    id: string;
    status: string;
    requestedSlots: number | null;
    assignedCount: number | null;
  } | null;
};

export async function getWalletFillStatus(
  userId: string,
): Promise<WalletFillStatus> {
  const summary = await getPortfolioSummaryForUser(userId);
  const active = await findActiveWalletFillJob(userId);
  const latest = await findLatestWalletFillJob(userId);

  const lastJob = latest
    ? {
        id: latest.id,
        status: latest.status,
        requestedSlots: latest.requestedSlots,
        assignedCount: latest.assignedCount,
      }
    : null;

  if (!summary.eligibleOperator) {
    return {
      available: false,
      reason: "ineligible",
      slotsRemaining: 0,
      activeJobId: null,
      lastJob,
    };
  }
  if (!summary.quotaConfigured) {
    return {
      available: false,
      reason: "no_quota",
      slotsRemaining: 0,
      activeJobId: null,
      lastJob,
    };
  }
  if (active) {
    return {
      available: false,
      reason: "running",
      slotsRemaining: summary.slotsRemaining,
      activeJobId: active.id,
      lastJob,
    };
  }
  if (summary.slotsRemaining <= 0) {
    return {
      available: false,
      reason: "complete",
      slotsRemaining: 0,
      activeJobId: null,
      lastJob,
    };
  }
  return {
    available: true,
    reason: "ready",
    slotsRemaining: summary.slotsRemaining,
    activeJobId: null,
    lastJob,
  };
}

export async function requestWalletFill(input: {
  actorId: string;
}): Promise<{ id: string; reused: boolean; requestedSlots: number }> {
  const actor = await prisma.user.findUnique({
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
  if (actor.role === "MEMBER" && !actor.canRunAcquisition) {
    throw new PortfolioError(
      "Autorize a aquisição do MEMBER antes de completar a carteira.",
    );
  }
  if (actor.role !== "ADMIN" && actor.role !== "MEMBER") {
    throw new PortfolioError("Sem permissão para completar a carteira.");
  }

  const existing = await findActiveWalletFillJob(actor.id);
  if (existing) {
    return {
      id: existing.id,
      reused: true,
      requestedSlots: existing.requestedSlots ?? 0,
    };
  }

  const summary = await getPortfolioSummaryForUser(actor.id);
  if (!summary.quotaConfigured) {
    throw new PortfolioError("Meta semanal ainda não configurada.");
  }
  if (summary.slotsRemaining <= 0) {
    throw new PortfolioError("A meta semanal já está completa.");
  }

  const requestedSlots = summary.slotsRemaining;
  const limit = walletFillBatchSize(requestedSlots);
  const search = getWalletFillSearchConfig();
  const week = getOperationalWeek();
  const fingerprint = walletFillFingerprint(actor.id, week.weekStartAt);
  const timeoutAt = new Date(Date.now() + ACQUISITION_JOB_TIMEOUT_MS);

  const created = await createAcquisitionJobAtomic({
    city: search.city,
    query: search.query,
    limit,
    campaign: search.campaign,
    fingerprint,
    requestedById: actor.id,
    timeoutAt,
    purpose: "WALLET_FILL",
    requestedSlots,
  });

  if (created.kind === "conflict") {
    return {
      id: created.existing.id,
      reused: true,
      requestedSlots: created.existing.requestedSlots ?? requestedSlots,
    };
  }

  const job = created.job;
  try {
    await dispatchJobToRunner({
      id: job.id,
      city: job.city,
      query: job.query,
      limit: job.limit,
      campaign: job.campaign,
      requestedById: job.requestedById,
      purpose: "WALLET_FILL",
      requestedSlots: job.requestedSlots,
    });
  } catch (error) {
    const message =
      error instanceof AcquisitionDispatchError
        ? error.message
        : "Falha ao acionar o runner de aquisição.";
    await updateFailedDispatch(job.id, message);
    throw error instanceof AcquisitionDispatchError
      ? error
      : new AcquisitionDispatchError(message);
  }

  return { id: job.id, reused: false, requestedSlots };
}
