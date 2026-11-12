export class LeadAiAnalysisDisabledError extends Error {
  readonly code = "AI_ANALYSIS_DISABLED" as const;

  constructor() {
    super("Lead AI analysis is disabled.");
    this.name = "LeadAiAnalysisDisabledError";
  }
}

/**
 * CRM entrypoints must call this before a run.
 * The isolated core stays callable in tests when the flag is off.
 * Only the exact string "true" enables the feature.
 */
export function isLeadAiAnalysisEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.LEAD_AI_ANALYSIS_ENABLED === "true";
}

export function assertLeadAiAnalysisEnabled(env?: NodeJS.ProcessEnv): void {
  if (!isLeadAiAnalysisEnabled(env)) {
    throw new LeadAiAnalysisDisabledError();
  }
}
