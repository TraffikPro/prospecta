import { z } from "zod";

export const ACQUISITION_LIMIT_MIN = 1;
export const ACQUISITION_LIMIT_MAX = 30;
export const ACQUISITION_JOB_TIMEOUT_MS = 15 * 60 * 1000;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
