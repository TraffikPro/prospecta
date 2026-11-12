import { z } from "zod";
import { analysisReportSchema, RUN_ERROR_CODES } from "../ai-analysis/schemas";
import type { AnalysisRunResult } from "../ai-analysis/orchestrator";
import type { LeadContextSource } from "../ai-analysis/tools";

export const requestSchema = z.object({
  leadId: z.string().regex(/^c[a-z0-9]{20,31}$/),
  requestKey: z.string().uuid(),
}).strict();
export const leadIdSchema = requestSchema.shape.leadId;
export const resultSchema = z.object({
  analysisRunId: z.string().uuid(),
  status: z.enum(["COMPLETE", "INCONCLUSIVE", "FAILED"]),
  errorCode: z.enum(RUN_ERROR_CODES).nullable(),
  report: analysisReportSchema.nullable(),
  agentVersion: z.string().min(1).max(60),
  model: z.string().min(1).max(80),
  usage: z.object({
    steps: z.number().int().min(0).max(100),
    toolCalls: z.number().int().min(0).max(100),
    tokens: z.number().int().min(0).max(100_000_000),
    estimatedCostMicros: z.number().int().min(0).max(2_000_000_000),
    durationMs: z.number().int().min(0).max(2_000_000_000),
  }),
}).superRefine((value, ctx) => {
  if (value.status === "FAILED" ? value.report !== null : value.report?.status !== value.status) {
    ctx.addIssue({ code: "custom", message: "Report status mismatch" });
  }
});
export type StoredResult = z.infer<typeof resultSchema>;
export type AnalysisView = {
  id: string;
  leadId: string;
  status: "RUNNING" | "COMPLETE" | "INCONCLUSIVE" | "FAILED";
  errorCode: string | null;
  report: z.infer<typeof analysisReportSchema> | null;
  createdAt: string;
  finishedAt: string | null;
};
export type AnalysisErrorCode = "FORBIDDEN" | "CONFLICT" | "STALE_RUN" | "RATE_LIMITED";
export class AnalysisAccessError extends Error {
  constructor(readonly code: AnalysisErrorCode) { super(code); }
}
export type AnalysisStore = {
  claim(input: { leadId: string; actorId: string; requestKey: string }): Promise<{
    kind: "acquired" | "busy" | "replay";
    analysis: AnalysisView;
  }>;
  context(leadId: string, actorId: string): Promise<unknown>;
  finish(id: string, actorId: string, result: StoredResult): Promise<AnalysisView>;
  fail(id: string, actorId: string): Promise<void>;
  latest(leadId: string, actorId: string): Promise<AnalysisView | null>;
};
export type AnalysisRunner = (input: {
  leadId: string;
  source: LeadContextSource;
}) => Promise<AnalysisRunResult>;
