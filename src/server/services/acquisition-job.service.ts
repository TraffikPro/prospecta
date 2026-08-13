import {
  ACQUISITION_JOB_TIMEOUT_MS,
  acquisitionJobCallbackSchema,
  acquisitionRequestSchema,
  normalizeAcquisitionFingerprint,
  type AcquisitionJobCallbackInput,
  type AcquisitionRequestInput,
} from "@/features/acquisition/acquisition.schema";
import {
  createAcquisitionJobAtomic,
  findAcquisitionJobById,
  listAcquisitionJobs,
  updateAcquisitionJobStatus,
  type AcquisitionJobWithRequester,
} from "@/server/repositories/acquisition-job.repository";

export class AcquisitionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcquisitionValidationError";
  }
}

export class AcquisitionConflictError extends Error {
  constructor(
    message: string,
    readonly existingJobId: string,
  ) {
    super(message);
    this.name = "AcquisitionConflictError";
  }
}

export class AcquisitionDispatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcquisitionDispatchError";
  }
}

function sanitizeErrorMessage(message: string | null | undefined): string | null {
  if (!message?.trim()) return null;
  const trimmed = message.trim().slice(0, 500);
  // Strip anything that looks like a bearer/token/key fragment
  return trimmed
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(AIza|sk-|re_)[A-Za-z0-9_-]{8,}\b/g, "[redacted]");
}

export function parseAcquisitionRequest(
  raw: Record<string, FormDataEntryValue | string | undefined>,
): AcquisitionRequestInput {
  const parsed = acquisitionRequestSchema.safeParse({
    city: raw.city,
    query: raw.query,
    limit: raw.limit,
    campaign: raw.campaign,
    confirmed: raw.confirmed,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AcquisitionValidationError(
      first?.message ?? "Dados inválidos para aquisição.",
    );
  }
  return parsed.data;
}

async function dispatchJobToRunner(job: {
  id: string;
  city: string;
  query: string;
  limit: number;
  campaign: string;
}): Promise<void> {
  const runnerUrl = process.env.ACQUISITION_RUNNER_URL?.trim().replace(/\/$/, "");
  const token = process.env.ACQUISITION_JOB_TOKEN?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

  if (!runnerUrl || !token || !appUrl) {
    throw new AcquisitionDispatchError(
      "Aquisição indisponível: runner ou token não configurados.",
    );
  }

  const callbackUrl = `${appUrl}/api/internal/acquisition-jobs/${job.id}`;
  const response = await fetch(`${runnerUrl}/v1/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jobId: job.id,
      city: job.city,
      query: job.query,
      limit: job.limit,
      campaign: job.campaign,
      prospectaBaseUrl: appUrl,
      callbackUrl,
    }),
  });

  if (response.status !== 202 && !response.ok) {
    throw new AcquisitionDispatchError(
      "Não foi possível acionar o runner de aquisição. Tente novamente mais tarde.",
    );
  }
}

export async function requestAcquisitionJob(input: {
  raw: Record<string, FormDataEntryValue | string | undefined>;
  requestedById: string;
}): Promise<{ id: string }> {
  const data = parseAcquisitionRequest(input.raw);
  const fingerprint = normalizeAcquisitionFingerprint(data);

  const timeoutAt = new Date(Date.now() + ACQUISITION_JOB_TIMEOUT_MS);
  const created = await createAcquisitionJobAtomic({
    city: data.city,
    query: data.query,
    limit: data.limit,
    campaign: data.campaign,
    fingerprint,
    requestedById: input.requestedById,
    timeoutAt,
  });

  if (created.kind === "conflict") {
    throw new AcquisitionConflictError(
      "Já existe uma aquisição em andamento para esta cidade, nicho e campanha.",
      created.existing.id,
    );
  }

  const job = created.job;

  try {
    await dispatchJobToRunner(job);
  } catch (error) {
    const message =
      error instanceof AcquisitionDispatchError
        ? error.message
        : "Falha ao acionar o runner de aquisição.";
    await updateAcquisitionJobStatus(job.id, {
      status: "FAILED",
      finishedAt: new Date(),
      errorMessage: sanitizeErrorMessage(message),
    });
    throw error instanceof AcquisitionDispatchError
      ? error
      : new AcquisitionDispatchError(message);
  }

  return { id: job.id };
}

export async function listAcquisitionJobsForAdmin(): Promise<
  AcquisitionJobWithRequester[]
> {
  return listAcquisitionJobs(40);
}

/** Alias for callers authorized via canRunAcquisition (ADMIN or opted-in MEMBER). */
export async function listAcquisitionJobsForOperator(): Promise<
  AcquisitionJobWithRequester[]
> {
  return listAcquisitionJobsForAdmin();
}

export function parseAcquisitionCallback(
  body: unknown,
): AcquisitionJobCallbackInput {
  const parsed = acquisitionJobCallbackSchema.safeParse(body);
  if (!parsed.success) {
    throw new AcquisitionValidationError("Payload de status inválido.");
  }
  return parsed.data;
}

const allowedTransitions: Record<
  string,
  ReadonlyArray<"RUNNING" | "SUCCEEDED" | "FAILED">
> = {
  QUEUED: ["RUNNING", "FAILED", "SUCCEEDED"],
  RUNNING: ["SUCCEEDED", "FAILED", "RUNNING"],
  SUCCEEDED: [],
  FAILED: [],
};

export async function applyAcquisitionJobCallback(
  jobId: string,
  body: unknown,
): Promise<{ id: string; status: string }> {
  const payload = parseAcquisitionCallback(body);
  const job = await findAcquisitionJobById(jobId);
  if (!job) {
    throw new AcquisitionValidationError("Job não encontrado.");
  }

  const allowed = allowedTransitions[job.status] ?? [];
  if (!allowed.includes(payload.status)) {
    throw new AcquisitionConflictError(
      `Transição inválida: ${job.status} → ${payload.status}`,
      job.id,
    );
  }

  const now = new Date();
  const terminal = payload.status === "SUCCEEDED" || payload.status === "FAILED";

  const updated = await updateAcquisitionJobStatus(jobId, {
    status: payload.status,
    startedAt:
      payload.status === "RUNNING" && !job.startedAt ? now : job.startedAt,
    finishedAt: terminal ? now : job.finishedAt,
    foundCount: payload.foundCount ?? job.foundCount,
    qualifiedCount: payload.qualifiedCount ?? job.qualifiedCount,
    createdTotal: payload.createdTotal ?? job.createdTotal,
    createdHigh: payload.createdHigh ?? job.createdHigh,
    existingCount: payload.existingCount ?? job.existingCount,
    failedCount: payload.failedCount ?? job.failedCount,
    errorMessage:
      payload.status === "FAILED"
        ? sanitizeErrorMessage(payload.errorMessage)
        : payload.status === "SUCCEEDED"
          ? null
          : job.errorMessage,
  });

  return { id: updated.id, status: updated.status };
}

export function isAcquisitionJobTimedOut(job: {
  status: string;
  timeoutAt: Date;
}): boolean {
  return (
    (job.status === "QUEUED" || job.status === "RUNNING") &&
    job.timeoutAt.getTime() < Date.now()
  );
}
