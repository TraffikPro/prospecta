import { isLeadAiAnalysisEnabled } from "../ai-analysis/feature-flag";
import { AnalysisAccessError, leadIdSchema, requestSchema, resultSchema,
  type AnalysisRunner, type AnalysisStore, type AnalysisView } from "./contracts";

type FailureCode = "AI_ANALYSIS_DISABLED" | "UNAUTHENTICATED" | "VALIDATION"
  | "PROVIDER_NOT_CONFIGURED" | "FORBIDDEN" | "CONFLICT" | "STALE_RUN" | "RATE_LIMITED" | "INTERNAL";
export type AnalysisResponse =
  | { ok: true; kind: "finished" | "busy" | "replay" | "read"; analysis: AnalysisView | null }
  | { ok: false; code: FailureCode };
type Dependencies = {
  store: AnalysisStore;
  runner: AnalysisRunner | null;
  enabled?: () => boolean;
};

export function createAnalysisService(deps: Dependencies) {
  const enabled = deps.enabled ?? isLeadAiAnalysisEnabled;
  const failure = (error: unknown): AnalysisResponse => ({
    ok: false, code: error instanceof AnalysisAccessError ? error.code : "INTERNAL",
  });
  return {
    async request(input: unknown, actorId: string | null): Promise<AnalysisResponse> {
      if (!enabled()) return { ok: false, code: "AI_ANALYSIS_DISABLED" };
      if (!actorId) return { ok: false, code: "UNAUTHENTICATED" };
      const parsed = requestSchema.safeParse(input);
      if (!parsed.success) return { ok: false, code: "VALIDATION" };
      if (!deps.runner) return { ok: false, code: "PROVIDER_NOT_CONFIGURED" };
      let claimedId: string | undefined;
      try {
        const claimed = await deps.store.claim({ ...parsed.data, actorId });
        if (claimed.kind !== "acquired") {
          return { ok: true, kind: claimed.kind, analysis: claimed.analysis };
        }
        claimedId = claimed.analysis.id;
        const leadId = parsed.data.leadId;
        const run = await deps.runner({
          leadId,
          source: {
            getById: async (requestedId) => requestedId === leadId
              ? deps.store.context(leadId, actorId) : null,
          },
        });
        // Persist only the validated public result, never the prompt/tool transcript.
        const result = resultSchema.parse(run);
        const analysis = await deps.store.finish(claimedId, actorId, result);
        return { ok: true, kind: "finished", analysis };
      } catch (error) {
        if (claimedId) {
          // Only our own RUNNING record can be failed. Never overwrite a newer run.
          try { await deps.store.fail(claimedId, actorId); } catch { /* lease expiry recovers it */ }
        }
        return failure(error);
      }
    },
    async latest(input: unknown, actorId: string | null): Promise<AnalysisResponse> {
      if (!enabled()) return { ok: false, code: "AI_ANALYSIS_DISABLED" };
      if (!actorId) return { ok: false, code: "UNAUTHENTICATED" };
      const parsed = leadIdSchema.safeParse(input);
      if (!parsed.success) return { ok: false, code: "VALIDATION" };
      try {
        return { ok: true, kind: "read", analysis: await deps.store.latest(parsed.data, actorId) };
      } catch (error) { return failure(error); }
    },
  };
}
