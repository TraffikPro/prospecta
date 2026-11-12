import "server-only";
import type { AnalysisRunner } from "./contracts";
import { isLocalAnalysisSimulation } from "./simulation-policy";
import { runSimulatedAnalysis } from "./simulated-runner";
import { liveAnalysisConfigured, isProductionAnalysisConfigured } from "./live-policy";
import { createOpenAIProvider, LIVE_LIMITS, OPENAI_COST } from "../ai-analysis/openai-provider";
import { runLeadAnalysis } from "../ai-analysis/orchestrator";
import { createNodePageFetcher } from "../ai-analysis/website/guarded-fetch";
import { authorizedLeadContextSchema } from "../ai-analysis/schemas";

export function getAnalysisRunner(): AnalysisRunner | null {
  if (isLocalAnalysisSimulation()) return runSimulatedAnalysis;
  if (!liveAnalysisConfigured()) return null;
  return async ({ leadId, source }) => {
    if (!liveAnalysisConfigured()) throw new Error("LIVE_ANALYSIS_DISABLED");
    const context = authorizedLeadContextSchema.parse(await source.getById(leadId));
    if (!isProductionAnalysisConfigured() && !context.companyName.startsWith("[AI DEMO]")) throw new Error("LOCAL_FIXTURE_REQUIRED");
    return runLeadAnalysis({ leadId, source,
      provider: createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! }),
      fetcher: createNodePageFetcher(), limits: LIVE_LIMITS, costTable: OPENAI_COST,
    });
  };
}
