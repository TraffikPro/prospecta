import type { AcquisitionJob, AcquisitionJobStatus, Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AcquisitionJobWithRequester = AcquisitionJob & {
  requestedBy: { id: string; name: string; email: string };
};

const requesterSelect = {
  requestedBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.AcquisitionJobInclude;

export async function findActiveJobByFingerprint(
  fingerprint: string,
): Promise<AcquisitionJob | null> {
  return prisma.acquisitionJob.findFirst({
    where: {
      fingerprint,
      status: { in: ["QUEUED", "RUNNING"] },
    },
    orderBy: { requestedAt: "desc" },
  });
}

export async function createAcquisitionJobRecord(data: {
  city: string;
  query: string;
  limit: number;
  campaign: string;
  fingerprint: string;
  requestedById: string;
  timeoutAt: Date;
}): Promise<AcquisitionJob> {
  return prisma.acquisitionJob.create({
    data: {
      city: data.city,
      query: data.query,
      limit: data.limit,
      campaign: data.campaign,
      fingerprint: data.fingerprint,
      requestedById: data.requestedById,
      timeoutAt: data.timeoutAt,
      status: "QUEUED",
    },
  });
}

/**
 * Create QUEUED job atomically. Relies on partial unique index
 * AcquisitionJob_active_fingerprint_key (QUEUED|RUNNING).
 * Returns { kind: 'created', job } or { kind: 'conflict', existing }.
 */
export async function createAcquisitionJobAtomic(data: {
  city: string;
  query: string;
  limit: number;
  campaign: string;
  fingerprint: string;
  requestedById: string;
  timeoutAt: Date;
}): Promise<
  | { kind: "created"; job: AcquisitionJob }
  | { kind: "conflict"; existing: AcquisitionJob }
> {
  try {
    const job = await createAcquisitionJobRecord(data);
    return { kind: "created", job };
  } catch (error) {
    if (
      error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await findActiveJobByFingerprint(data.fingerprint);
      if (existing) {
        return { kind: "conflict", existing };
      }
    }
    throw error;
  }
}

export async function findAcquisitionJobById(
  id: string,
): Promise<AcquisitionJob | null> {
  return prisma.acquisitionJob.findUnique({ where: { id } });
}

export async function listAcquisitionJobs(
  take = 30,
): Promise<AcquisitionJobWithRequester[]> {
  return prisma.acquisitionJob.findMany({
    take,
    orderBy: { requestedAt: "desc" },
    include: requesterSelect,
  });
}

export async function updateAcquisitionJobStatus(
  id: string,
  data: {
    status: AcquisitionJobStatus;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    foundCount?: number | null;
    qualifiedCount?: number | null;
    createdTotal?: number | null;
    createdHigh?: number | null;
    existingCount?: number | null;
    failedCount?: number | null;
    errorMessage?: string | null;
  },
): Promise<AcquisitionJob> {
  return prisma.acquisitionJob.update({
    where: { id },
    data,
  });
}
