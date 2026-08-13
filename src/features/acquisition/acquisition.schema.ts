import { z } from "zod";

export const ACQUISITION_LIMIT_MIN = 1;
export const ACQUISITION_LIMIT_MAX = 30;
export const ACQUISITION_JOB_TIMEOUT_MS = 15 * 60 * 1000;
export const WALLET_FILL_MIN_BATCH = 4;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const leadIdSchema = z.string().trim().min(1).max(40);

export const acquisitionRequestSchema = z.object({
  city: z
    .string()
    .trim()
    .min(2, "Informe a cidade.")
    .max(120, "Cidade muito longa."),
  query: z
    .string()
    .trim()
    .min(2, "Informe o nicho / busca.")
    .max(120, "Busca muito longa."),
  limit: z.coerce
    .number()
    .int()
    .min(ACQUISITION_LIMIT_MIN, `Mínimo ${ACQUISITION_LIMIT_MIN}.`)
    .max(ACQUISITION_LIMIT_MAX, `Máximo ${ACQUISITION_LIMIT_MAX}.`),
  campaign: z
    .string()
    .trim()
    .min(3, "Informe o identificador da campanha.")
    .max(80, "Campanha muito longa.")
    .regex(slugRegex, "Use slug em minúsculas (ex.: santos-odontologia-2026-07)."),
  confirmed: z.literal("on", {
    errorMap: () => ({ message: "Confirme antes de executar." }),
  }),
});

export type AcquisitionRequestInput = z.infer<typeof acquisitionRequestSchema>;

export const acquisitionJobCallbackSchema = z.object({
  status: z.enum(["RUNNING", "SUCCEEDED", "FAILED"]),
  foundCount: z.number().int().nonnegative().optional().nullable(),
  qualifiedCount: z.number().int().nonnegative().optional().nullable(),
  createdTotal: z.number().int().nonnegative().optional().nullable(),
  createdHigh: z.number().int().nonnegative().optional().nullable(),
  existingCount: z.number().int().nonnegative().optional().nullable(),
  failedCount: z.number().int().nonnegative().optional().nullable(),
  errorMessage: z.string().trim().max(500).optional().nullable(),
  requestedById: z.string().trim().min(1).max(40).optional(),
  leadIds: z.array(leadIdSchema).max(50).optional(),
  createdLeadIds: z.array(leadIdSchema).max(50).optional(),
  existingLeadIds: z.array(leadIdSchema).max(50).optional(),
});

export type AcquisitionJobCallbackInput = z.infer<
  typeof acquisitionJobCallbackSchema
>;

export function normalizeAcquisitionFingerprint(input: {
  city: string;
  query: string;
  campaign: string;
}): string {
  const norm = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  return `${norm(input.city)}|${norm(input.query)}|${norm(input.campaign)}`;
}

/** One active WALLET_FILL job per operator + operational week. */
export function walletFillFingerprint(
  userId: string,
  weekStartAt: Date,
): string {
  return `fill|${userId}|${weekStartAt.toISOString()}`;
}

/**
 * Oversample remaining slots without a sophisticated loop.
 * remaining=3 → batch 6 (min 4, max 30).
 */
export function walletFillBatchSize(remaining: number): number {
  if (!Number.isInteger(remaining) || remaining <= 0) {
    return 0;
  }
  return Math.min(
    Math.max(remaining * 2, WALLET_FILL_MIN_BATCH),
    ACQUISITION_LIMIT_MAX,
  );
}

export type WalletFillSearchConfig = {
  city: string;
  query: string;
  campaign: string;
};

const DEFAULT_FILL_CITY = "Santos SP";
const DEFAULT_FILL_QUERY = "clínica odontológica";
const DEFAULT_FILL_CAMPAIGN = "santos-odontologia";

/** Pilot workspace defaults; override with ACQUISITION_FILL_* env. */
export function getWalletFillSearchConfig(): WalletFillSearchConfig {
  const city =
    process.env.ACQUISITION_FILL_CITY?.trim() || DEFAULT_FILL_CITY;
  const query =
    process.env.ACQUISITION_FILL_QUERY?.trim() || DEFAULT_FILL_QUERY;
  const campaign =
    process.env.ACQUISITION_FILL_CAMPAIGN?.trim() || DEFAULT_FILL_CAMPAIGN;
  return { city, query, campaign };
}
