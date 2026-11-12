import { z } from "zod";

export const LEAD_SOURCES = [
  "MANUAL",
  "GOOGLE_PLACES",
  "REFERRAL",
  "IMPORT",
] as const;

export const leadReputationSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().min(0).optional(),
  signals: z.array(z.string().trim().min(1).max(40)).max(20),
  qualification: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  score: z.number().min(0).max(100).optional(),
});

export const authorizedLeadContextSchema = z
  .object({
    leadId: z.string().trim().min(1).max(80),
    companyName: z.string().trim().min(1).max(200),
    website: z.string().trim().url().nullable(),
    source: z.enum(LEAD_SOURCES),
    reputation: leadReputationSchema,
  })
  .strict();

export type AuthorizedLeadContext = z.infer<typeof authorizedLeadContextSchema>;

export const evidenceSchema = z.object({
  id: z.string().trim().min(1).max(40),
  url: z.string().trim().url().max(300),
  collectedAt: z.string().datetime(),
  excerpt: z.string().max(500),
});

export const analysisReportSchema = z.object({
  schemaVersion: z.literal("1"),
  status: z.enum(["COMPLETE", "INCONCLUSIVE"]),
  researchedAt: z.string().datetime(),
  agentVersion: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  summary: z.string().trim().max(1000).nullable(),
  digitalPresence: z.object({
    hasPublicWebsite: z.union([z.boolean(), z.literal("unknown")]),
    observations: z
      .array(
        z.object({
          statement: z.string().trim().min(1).max(500),
          evidenceIds: z.array(z.string().trim().min(1).max(40)).max(5),
        }),
      )
      .max(8),
  }),
  opportunities: z
    .array(
      z.object({
        hypothesis: z.string().trim().min(1).max(500),
        rationale: z.string().trim().min(1).max(500),
        evidenceIds: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
      }),
    )
    .max(5),
  insufficientInformation: z.array(z.string().trim().min(1).max(300)).max(8),
  limitations: z.array(z.string().trim().min(1).max(300)).max(8),
  evidence: z.array(evidenceSchema).max(8),
});

export type AnalysisReport = z.infer<typeof analysisReportSchema>;

export const draftReportSchema = z.object({
  status: z.enum(["COMPLETE", "INCONCLUSIVE"]),
  summary: z.string().trim().max(1000).nullable(),
  digitalPresence: z.object({
    hasPublicWebsite: z.union([z.boolean(), z.literal("unknown")]),
    observations: z
      .array(
        z.object({
          statement: z.string().trim().min(1).max(500),
          evidenceIds: z.array(z.string().trim().min(1).max(40)).max(5),
        }),
      )
      .max(8),
  }),
  opportunities: z
    .array(
      z.object({
        hypothesis: z.string().trim().min(1).max(500),
        rationale: z.string().trim().min(1).max(500),
        evidenceIds: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
      }),
    )
    .max(5),
  insufficientInformation: z.array(z.string().trim().min(1).max(300)).max(8),
  limitations: z.array(z.string().trim().min(1).max(300)).max(8),
});

export type DraftReport = z.infer<typeof draftReportSchema>;

export const RUN_ERROR_CODES = [
  "LEAD_NOT_FOUND",
  "INVALID_TOOL_CALL",
  "LIMIT_STEPS",
  "LIMIT_TOOL_CALLS",
  "LIMIT_DURATION",
  "LIMIT_TOKENS",
  "LIMIT_COST",
  "TIMEOUT",
  "PROVIDER_ERROR",
  "INVALID_OUTPUT",
  "EVIDENCE_INVALID",
] as const;

export type RunErrorCode = (typeof RUN_ERROR_CODES)[number];

export const TOOL_ERROR_CODES = [
  "LEAD_NOT_FOUND",
  "INVALID_CONTEXT",
  "CONTEXT_REQUIRED",
  "NO_WEBSITE",
  "URL_NOT_ALLOWED",
  "BLOCKED_URL",
  "DNS_BLOCKED",
  "REDIRECT_BLOCKED",
  "UNSUPPORTED_CONTENT",
  "UNAVAILABLE",
  "TIMEOUT",
  "TOO_LARGE",
  "URL_LIMIT",
  "CONTENT_LIMIT",
  "UNKNOWN_TOOL",
  "INVALID_ARGUMENTS",
  "TOOL_FAILED",
] as const;

export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[number];
