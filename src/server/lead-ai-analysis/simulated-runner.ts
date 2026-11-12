import { runLeadAnalysis } from "../ai-analysis/orchestrator";
import { createScriptedProvider, lastToolPayload } from "../ai-analysis/provider";
import { authorizedLeadContextSchema } from "../ai-analysis/schemas";
import type { AnalysisRunner } from "./contracts";
import { isLocalAnalysisSimulation } from "./simulation-policy";

/** Only explicit [AI DEMO] fixtures in a dedicated local DB may enter this runner. */
export const runSimulatedAnalysis: AnalysisRunner = async ({ leadId, source }) => {
  if (!isLocalAnalysisSimulation()) throw new Error("Local simulation disabled");
  const context = authorizedLeadContextSchema.parse(await source.getById(leadId));
  if (!context.companyName.startsWith("[AI DEMO]")) throw new Error("Simulation requires fixture");
  let turn = 0;
  const provider = createScriptedProvider({ model: "local-simulation-only", respond: async ({ messages }) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    turn++;
    if (turn === 1) return { type: "tool_calls", calls: [{ name: "getLeadContext", arguments: {} }] };
    if (context.companyName.includes("[FAIL]")) throw new Error("Simulated provider unavailable");
    if (context.website && turn === 2) return { type: "tool_calls", calls: [{ name: "inspectWebsite", arguments: { url: context.website } }] };
    const payload = lastToolPayload(messages) as { evidenceId?: string } | null;
    const evidenceIds = payload?.evidenceId ? [payload.evidenceId] : [];
    return { type: "final", draft: {
      status: evidenceIds.length ? "COMPLETE" : "INCONCLUSIVE",
      summary: evidenceIds.length ? "A empresa fictícia apresenta seus serviços e oferece contato pelo site." : null,
      digitalPresence: { hasPublicWebsite: Boolean(context.website), observations: evidenceIds.length
        ? [{ statement: "A página apresenta serviços e formulário de contato.", evidenceIds }] : [] },
      opportunities: evidenceIds.length ? [{ hypothesis: "Explorar melhorias no atendimento a pedidos recebidos pelo site.", rationale: "O formulário de contato pode ser um ponto de partida para entender o processo comercial.", evidenceIds }] : [],
      insufficientInformation: evidenceIds.length ? [] : ["Um website público para apoiar a pesquisa."],
      limitations: ["Demonstração local: conteúdo fictício, sem pesquisa externa.", "As hipóteses precisam ser validadas com o lead."],
    } };
  } });
  return runLeadAnalysis({ leadId, source, provider, fetcher: { fetch: async ({ url }) => ({
    ok: true, kind: "document", url, status: 200,
    text: "<html><body><h1>Empresa fictícia Aurora</h1><p>A página apresenta serviços e formulário de contato.</p></body></html>",
  }) } });
};
