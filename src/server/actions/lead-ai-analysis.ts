"use server";

import { isLeadAiAnalysisEnabled } from "../ai-analysis/feature-flag";
import type { AnalysisResponse } from "../lead-ai-analysis/service";
import { isAnalysisUserAllowed } from "../lead-ai-analysis/access-policy";

async function dependencies() {
  const [{ getSessionUser }, { prisma }, { createAnalysisStore }, { createAnalysisService }, { getAnalysisRunner }] = await Promise.all([
    import("../auth/session"), import("@/lib/prisma"), import("../lead-ai-analysis/repository"),
    import("../lead-ai-analysis/service"), import("../lead-ai-analysis/runtime"),
  ]);
  const actor = await getSessionUser();
  return { allowed: !actor || isAnalysisUserAllowed(actor), actorId: actor?.id ?? null, service: createAnalysisService({ store: createAnalysisStore(prisma), runner: getAnalysisRunner() }) };
}

export async function requestLeadAIAnalysisAction(input: unknown): Promise<AnalysisResponse> {
  // Disabled means no session/database/provider access, including module initialization.
  if (!isLeadAiAnalysisEnabled()) return { ok: false, code: "AI_ANALYSIS_DISABLED" };
  try {
    const { allowed, actorId, service } = await dependencies();
    if (!allowed) return { ok: false, code: "FORBIDDEN" };
    return await service.request(input, actorId);
  } catch { return { ok: false, code: "INTERNAL" }; }
}

export async function getLeadAIAnalysisAction(leadId: unknown): Promise<AnalysisResponse> {
  if (!isLeadAiAnalysisEnabled()) return { ok: false, code: "AI_ANALYSIS_DISABLED" };
  try {
    const { allowed, actorId, service } = await dependencies();
    if (!allowed) return { ok: false, code: "FORBIDDEN" };
    return await service.latest(leadId, actorId);
  } catch { return { ok: false, code: "INTERNAL" }; }
}
