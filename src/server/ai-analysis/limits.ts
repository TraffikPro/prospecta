export const AGENT_VERSION = "prospecta-ai-analysis-0.1.0";

export type AnalysisLimits = {
  maxSteps: number;
  maxToolCalls: number;
  maxUrls: number;
  maxRedirects: number;
  maxDurationMs: number;
  maxToolDurationMs: number;
  maxExtractedChars: number;
  maxPageChars: number;
  maxExcerptChars: number;
  maxTokens: number;
  maxEstimatedCostMicros: number;
  maxRepairAttempts: number;
  maxResponseBytes: number;
};

/** Ceiling for one on-demand lead. Not a vendor invoice. */
export const DEFAULT_LIMITS: AnalysisLimits = {
  maxSteps: 6,
  maxToolCalls: 6,
  maxUrls: 3,
  maxRedirects: 2,
  maxDurationMs: 45_000,
  maxToolDurationMs: 5_000,
  maxExtractedChars: 20_000,
  maxPageChars: 8_000,
  maxExcerptChars: 1_500,
  maxTokens: 8_000,
  maxEstimatedCostMicros: 20_000,
  maxRepairAttempts: 1,
  maxResponseBytes: 100_000,
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type CostTable = {
  /** Micros (1e-6 of the currency unit) per 1_000 input tokens. */
  inputMicrosPerThousand: number;
  outputMicrosPerThousand: number;
};

/**
 * Conservative stand-in used only to enforce the run ceiling.
 * Replace with the contracted provider price before any paid call.
 */
export const DEFAULT_COST_TABLE: CostTable = {
  inputMicrosPerThousand: 5_000,
  outputMicrosPerThousand: 15_000,
};

export function normalizeTokenCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(Math.floor(value), 1_000_000);
}

export function estimateCostMicros(usage: TokenUsage, table: CostTable): number {
  const input = Math.ceil(
    (normalizeTokenCount(usage.inputTokens) / 1000) * table.inputMicrosPerThousand,
  );
  const output = Math.ceil(
    (normalizeTokenCount(usage.outputTokens) / 1000) *
      table.outputMicrosPerThousand,
  );
  return input + output;
}
