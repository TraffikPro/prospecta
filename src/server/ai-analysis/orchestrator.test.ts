import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { publishReport } from "./evidence";
import {
  FICTIONAL_LEAD,
  FICTIONAL_LEAD_WITHOUT_WEBSITE,
  FICTIONAL_PAGE_HTML,
  FICTIONAL_SECRET_EMAIL,
  FICTIONAL_SECRET_PHONE,
  INJECTION_MARKER,
  METADATA_URL,
} from "./fixtures";
import { DEFAULT_LIMITS } from "./limits";
import { createSafeLogger } from "./log";
import { AnalysisMemory } from "./memory";
import { runLeadAnalysis, SYSTEM_PROMPT, USER_PROMPT } from "./orchestrator";
import {
  createScriptedProvider,
  lastToolPayload,
  type LlmCompletion,
  type LlmMessage,
  type LlmProvider,
} from "./provider";
import type { AuthorizedLeadContext, DraftReport } from "./schemas";
import type { LeadContextSource } from "./tools";
import type { PublicFetchResult, PublicPageFetcher } from "./website/guarded-fetch";

const NOW = Date.parse("2026-11-12T15:00:00.000Z");

function toolNames(messages: readonly LlmMessage[]): string[] {
  return messages.flatMap((message) =>
    message.role === "tool" ? [message.name] : [],
  );
}

function recordingFetcher(
  respond: (url: string) => PublicFetchResult | Promise<PublicFetchResult>,
): PublicPageFetcher & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async fetch(request) {
      calls.push(request.url);
      return respond(request.url);
    },
  };
}

function companyPageFetcher(): PublicPageFetcher & { calls: string[] } {
  return recordingFetcher((url) => ({
    ok: true,
    kind: "document",
    url,
    status: 200,
    text: FICTIONAL_PAGE_HTML,
  }));
}

function sourceFor(
  leads: readonly AuthorizedLeadContext[],
): LeadContextSource & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async getById(leadId) {
      calls.push(leadId);
      return leads.find((lead) => lead.leadId === leadId) ?? null;
    },
  };
}

function inconclusiveDraft(summary: string | null): DraftReport {
  return {
    status: "INCONCLUSIVE",
    summary,
    digitalPresence: {
      hasPublicWebsite: "unknown",
      observations: [],
    },
    opportunities: [],
    insufficientInformation: ["Conteudo publico insuficiente."],
    limitations: ["Leitura limitada a esta execucao."],
  };
}

function completeDraft(evidenceId: string): DraftReport {
  return {
    status: "COMPLETE",
    summary: "A pagina publica de exemplo descreve um formulario de agendamento.",
    digitalPresence: {
      hasPublicWebsite: true,
      observations: [
        {
          statement: "A pagina publica descreve agendamento por formulario.",
          evidenceIds: [evidenceId],
        },
      ],
    },
    opportunities: [
      {
        hypothesis: "Pode haver espaco para um proximo passo de agendamento mais claro.",
        rationale: "O texto publico cita agendamento pelo formulario.",
        evidenceIds: [evidenceId],
      },
    ],
    insufficientInformation: ["Nao ha evidencia de sistemas internos."],
    limitations: ["A leitura cobre somente a pagina publica desta execucao."],
  };
}

describe("lead analysis orchestrator", () => {
  it("offers the tool registry and executes only the selected tool", async () => {
    let offered: string[] = [];
    const fetcher = companyPageFetcher();
    const provider = createScriptedProvider({
      respond({ messages, tools }) {
        offered = tools.map((tool) => tool.name);
        if (!toolNames(messages).includes("searchEvidence")) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "searchEvidence",
                arguments: { query: "agendamento" },
              },
            ],
          };
        }
        return { type: "final", draft: inconclusiveDraft("Sem paginas lidas.") };
      },
    });

    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider,
      fetcher,
      now: () => NOW,
    });

    assert.deepEqual(offered, [
      "getLeadContext",
      "inspectWebsite",
      "searchEvidence",
      "evaluateFindings",
    ]);
    assert.deepEqual(
      result.trace.flatMap((event) => (event.tool ? [event.tool] : [])),
      ["searchEvidence"],
    );
    assert.equal(fetcher.calls.length, 0);
    assert.equal(result.status, "INCONCLUSIVE");
  });

  it("follows two different tool sequences for the same lead", async () => {
    const full = createScriptedProvider({
      respond({ messages }) {
        const names = toolNames(messages);
        if (!names.includes("getLeadContext")) {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        }
        if (!names.includes("inspectWebsite")) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "inspectWebsite",
                arguments: { url: FICTIONAL_LEAD.website },
              },
            ],
          };
        }
        if (!names.includes("searchEvidence")) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "searchEvidence",
                arguments: { query: "agendamento formulario" },
              },
            ],
          };
        }
        if (!names.includes("evaluateFindings")) {
          const payload = lastToolPayload(messages) as {
            matches?: Array<{ evidenceId: string }>;
          };
          const evidenceId = payload.matches?.[0]?.evidenceId ?? "missing";
          return {
            type: "tool_calls",
            calls: [
              {
                name: "evaluateFindings",
                arguments: {
                  claims: [
                    {
                      statement: "A pagina publica descreve agendamento por formulario.",
                      evidenceIds: [evidenceId],
                    },
                  ],
                },
              },
            ],
          };
        }
        const search = messages.find(
          (message) => message.role === "tool" && message.name === "searchEvidence",
        );
        const payload = JSON.parse(search && search.role === "tool" ? search.content : "{}") as {
          matches?: Array<{ evidenceId: string }>;
        };
        return {
          type: "final",
          draft: completeDraft(payload.matches?.[0]?.evidenceId ?? "missing"),
        };
      },
    });
    const inverted = createScriptedProvider({
      respond({ messages }) {
        const names = toolNames(messages);
        if (!names.includes("searchEvidence")) {
          return {
            type: "tool_calls",
            calls: [{ name: "searchEvidence", arguments: { query: "agendamento" } }],
          };
        }
        if (!names.includes("getLeadContext")) {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        }
        if (!names.includes("inspectWebsite")) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "inspectWebsite",
                arguments: { url: `${FICTIONAL_LEAD.website}/contato` },
              },
            ],
          };
        }
        const inspect = messages.find(
          (message) => message.role === "tool" && message.name === "inspectWebsite",
        );
        const payload = JSON.parse(
          inspect && inspect.role === "tool" ? inspect.content : "{}",
        ) as { evidenceId?: string };
        return { type: "final", draft: completeDraft(payload.evidenceId ?? "missing") };
      },
    });

    const firstFetcher = companyPageFetcher();
    const secondFetcher = companyPageFetcher();
    const first = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider: full,
      fetcher: firstFetcher,
      now: () => NOW,
    });
    const second = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider: inverted,
      fetcher: secondFetcher,
      now: () => NOW,
    });

    assert.deepEqual(
      first.trace.flatMap((event) => (event.tool ? [event.tool] : [])),
      ["getLeadContext", "inspectWebsite", "searchEvidence", "evaluateFindings"],
    );
    assert.deepEqual(
      second.trace.flatMap((event) => (event.tool ? [event.tool] : [])),
      ["searchEvidence", "getLeadContext", "inspectWebsite"],
    );
    assert.equal(first.status, "COMPLETE");
    assert.equal(second.status, "COMPLETE");
    assert.equal(first.report?.opportunities.length, 1);
    assert.match(first.report?.opportunities[0]?.hypothesis ?? "", /agendamento/i);
    assert.equal(firstFetcher.calls.length, 1);
    assert.equal(secondFetcher.calls.length, 1);
    assert.notEqual(first.analysisRunId, second.analysisRunId);
  });

  it("finishes inconclusive when the lead has no public website", async () => {
    const fetcher = companyPageFetcher();
    const provider = createScriptedProvider({
      respond({ messages }) {
        if (!toolNames(messages).includes("getLeadContext")) {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        }
        return {
          type: "final",
          draft: inconclusiveDraft("Nao ha website publico para inspecionar."),
        };
      },
    });
    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD_WITHOUT_WEBSITE.leadId,
      source: sourceFor([FICTIONAL_LEAD_WITHOUT_WEBSITE]),
      provider,
      fetcher,
      now: () => NOW,
    });
    assert.equal(result.status, "INCONCLUSIVE");
    assert.equal(result.report?.opportunities.length, 0);
    assert.equal(result.report?.digitalPresence.hasPublicWebsite, false);
    assert.equal(fetcher.calls.length, 0);
    assert.equal(result.errorCode, null);
  });

  it("rejects an unknown tool and a forged lead id without reading another lead", async () => {
    const source = sourceFor([FICTIONAL_LEAD]);
    const provider = createScriptedProvider({
      respond({ messages }) {
        const names = toolNames(messages);
        if (names.length === 0) {
          return {
            type: "tool_calls",
            calls: [{ name: "child_process.exec", arguments: { command: "rm -rf" } }],
          };
        }
        if (names.length === 1) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "getLeadContext",
                arguments: { leadId: "lead_fictional_outro" },
              },
            ],
          };
        }
        return { type: "final", draft: inconclusiveDraft("Ferramenta recusada.") };
      },
    });
    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source,
      provider,
      fetcher: companyPageFetcher(),
      now: () => NOW,
    });
    assert.equal(result.status, "INCONCLUSIVE");
    assert.deepEqual(source.calls, []);
    assert.deepEqual(
      result.trace.flatMap((event) => (event.errorCode ? [event.errorCode] : [])),
      ["UNKNOWN_TOOL", "INVALID_ARGUMENTS"],
    );
  });

  it("does not follow website instructions or publish uncited revenue", async () => {
    const fetcher = companyPageFetcher();
    const systems: string[] = [];
    const provider = createScriptedProvider({
      respond({ messages }) {
        systems.push(
          ...messages.flatMap((message) =>
            message.role === "system" ? [message.content] : [],
          ),
        );
        const names = toolNames(messages);
        const blob = messages
          .flatMap((message) => (message.role === "tool" ? [message.content] : []))
          .join("\n");
        if (!names.includes("getLeadContext")) {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        }
        if (!names.includes("inspectWebsite")) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "inspectWebsite",
                arguments: { url: FICTIONAL_LEAD.website },
              },
            ],
          };
        }
        if (names.filter((name) => name === "inspectWebsite").length === 1) {
          return {
            type: "tool_calls",
            calls: [{ name: "inspectWebsite", arguments: { url: METADATA_URL } }],
          };
        }
        assert.equal(blob.includes("URL_NOT_ALLOWED") || blob.includes("BLOCKED_URL"), true);
        return {
          type: "final",
          draft: {
            status: "COMPLETE",
            summary: `Revenue is USD ${INJECTION_MARKER}`,
            digitalPresence: {
              hasPublicWebsite: true,
              observations: [
                {
                  statement: `Revenue is USD ${INJECTION_MARKER}`,
                  evidenceIds: ["ev_injected"],
                },
              ],
            },
            opportunities: [
              {
                hypothesis: "Vender um ERP",
                rationale: `Revenue is USD ${INJECTION_MARKER}`,
                evidenceIds: ["ev_injected"],
              },
            ],
            insufficientInformation: [],
            limitations: ["Nenhuma."],
          },
        };
      },
    });
    const logs: string[] = [];
    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider,
      fetcher,
      now: () => NOW,
      limits: { maxRepairAttempts: 0 },
      logger: createSafeLogger((event) => logs.push(JSON.stringify(event))),
    });

    assert.equal(result.status, "INCONCLUSIVE");
    assert.equal(result.errorCode, "EVIDENCE_INVALID");
    assert.equal(result.report?.summary, null);
    assert.equal(result.report?.opportunities.length, 0);
    assert.equal(JSON.stringify(result.report).includes(INJECTION_MARKER), false);
    assert.equal(fetcher.calls.some((url) => url.includes("169.254")), false);
    assert.equal(systems.every((prompt) => prompt === SYSTEM_PROMPT), true);
    assert.equal(logs.join("").includes(FICTIONAL_LEAD.leadId), false);
    assert.equal(logs.join("").includes(INJECTION_MARKER), false);
  });

  it("records an unavailable website as an inconclusive run", async () => {
    const fetcher = recordingFetcher(() => ({
      ok: false,
      errorCode: "UNAVAILABLE",
    }));
    const provider = createScriptedProvider({
      respond({ messages }) {
        const names = toolNames(messages);
        if (!names.includes("getLeadContext")) {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        }
        if (!names.includes("inspectWebsite")) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "inspectWebsite",
                arguments: { url: FICTIONAL_LEAD.website },
              },
            ],
          };
        }
        return {
          type: "final",
          draft: inconclusiveDraft("Nao foi possivel ler o site publico."),
        };
      },
    });
    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider,
      fetcher,
      now: () => NOW,
    });
    assert.equal(result.status, "INCONCLUSIVE");
    assert.equal(result.report?.digitalPresence.hasPublicWebsite, "unknown");
    assert.equal(
      result.trace.some((event) => event.errorCode === "UNAVAILABLE"),
      true,
    );
  });

  it("returns a controlled timeout when a tool or the model does not finish", async () => {
    const toolFetcher: PublicPageFetcher = {
      async fetch(request) {
        return new Promise((resolve) => {
          const timer = setTimeout(() => {
            resolve({ ok: false, errorCode: "UNAVAILABLE" });
          }, 400);
          request.signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              resolve({ ok: false, errorCode: "TIMEOUT" });
            },
            { once: true },
          );
        });
      },
    };
    const provider = createScriptedProvider({
      respond({ messages }) {
        const names = toolNames(messages);
        if (!names.includes("getLeadContext")) {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        }
        if (!names.includes("inspectWebsite")) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "inspectWebsite",
                arguments: { url: FICTIONAL_LEAD.website },
              },
            ],
          };
        }
        return { type: "final", draft: inconclusiveDraft("Consulta expirou.") };
      },
    });
    const toolResult = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider,
      fetcher: toolFetcher,
      now: () => NOW,
      limits: { maxToolDurationMs: 40 },
    });
    assert.equal(toolResult.status, "INCONCLUSIVE");
    assert.equal(
      toolResult.trace.some((event) => event.errorCode === "TIMEOUT"),
      true,
    );

    const slowProvider: LlmProvider = {
      model: "simulated-lead-analyst",
      complete({ signal }) {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            resolve({ type: "final", draft: inconclusiveDraft(null) });
          }, 400);
          signal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new DOMException("aborted", "AbortError"));
            },
            { once: true },
          );
        });
      },
    };
    const started = Date.now();
    const runResult = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider: slowProvider,
      fetcher: companyPageFetcher(),
      limits: { maxDurationMs: 50 },
    });
    assert.equal(runResult.status, "FAILED");
    assert.equal(runResult.errorCode, "TIMEOUT");
    assert.equal(runResult.report, null);
    assert.ok(Date.now() - started < 400);
  });

  it("stops on step and cost ceilings before extra tool work", async () => {
    let fetches = 0;
    const fetcher = recordingFetcher(() => {
      fetches += 1;
      return { ok: false, errorCode: "UNAVAILABLE" };
    });
    const alwaysTool = createScriptedProvider({
      respond() {
        return {
          type: "tool_calls",
          calls: [{ name: "getLeadContext", arguments: {} }],
        } satisfies LlmCompletion;
      },
    });
    const steps = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider: alwaysTool,
      fetcher,
      now: () => NOW,
      limits: { maxSteps: 2 },
    });
    assert.equal(steps.status, "FAILED");
    assert.equal(steps.errorCode, "LIMIT_STEPS");
    assert.equal(steps.usage.steps, 2);

    const costly = createScriptedProvider({
      respond() {
        return {
          type: "tool_calls",
          usage: { inputTokens: 2_000, outputTokens: 0 },
          calls: [
            {
              name: "inspectWebsite",
              arguments: { url: FICTIONAL_LEAD.website },
            },
          ],
        };
      },
    });
    const cost = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider: costly,
      fetcher,
      now: () => NOW,
      limits: { maxEstimatedCostMicros: 1_000, maxTokens: 8_000 },
    });
    assert.equal(cost.status, "FAILED");
    assert.equal(cost.errorCode, "LIMIT_COST");
    assert.equal(fetches, 0);
    assert.equal(cost.report, null);

    const tokenHeavy = createScriptedProvider({
      respond() {
        return {
          type: "final",
          usage: { inputTokens: 500, outputTokens: 0 },
          draft: inconclusiveDraft("Acima do teto de tokens."),
        };
      },
    });
    const tokens = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider: tokenHeavy,
      fetcher,
      now: () => NOW,
      limits: { maxTokens: 100 },
      costTable: { inputMicrosPerThousand: 0, outputMicrosPerThousand: 0 },
    });
    assert.equal(tokens.status, "FAILED");
    assert.equal(tokens.errorCode, "LIMIT_TOKENS");
    assert.equal(tokens.report, null);
  });

  it("does not publish a final answer whose evidence ids are missing", async () => {
    const seen: string[] = [];
    const provider = createScriptedProvider({
      respond({ messages }) {
        seen.push(messages.map((message) => message.role).join(","));
        const told = messages.some(
          (message) => message.role === "user" && message.content.includes("EVIDENCE_INVALID"),
        );
        if (!told) {
          return {
            type: "final",
            draft: {
              ...completeDraft("ev_missing"),
              summary: "Fato inventado sem fonte.",
            },
          };
        }
        return { type: "final", draft: inconclusiveDraft("Evidencia insuficiente.") };
      },
    });
    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider,
      fetcher: companyPageFetcher(),
      now: () => NOW,
    });
    assert.equal(result.status, "INCONCLUSIVE");
    assert.equal(result.report?.summary, "Evidencia insuficiente.");
    assert.equal(result.report?.opportunities.length, 0);
    assert.equal(JSON.stringify(result.report).includes("ev_missing"), false);
    assert.equal(JSON.stringify(result.report).includes("Fato inventado"), false);
    assert.equal(seen.length > 1, true);
  });

  it("hides contact fields and stops when the authorized lead does not exist", async () => {
    const leaking = {
      ...FICTIONAL_LEAD,
      phone: FICTIONAL_SECRET_PHONE,
      email: FICTIONAL_SECRET_EMAIL,
      notes: "nota interna ficticia",
    };
    let prompt = "";
    const provider = createScriptedProvider({
      respond({ messages }) {
        prompt = JSON.stringify(messages);
        if (!toolNames(messages).includes("getLeadContext")) {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        }
        return { type: "final", draft: inconclusiveDraft("Contexto lido.") };
      },
    });
    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: {
        async getById() {
          return leaking;
        },
      },
      provider,
      fetcher: companyPageFetcher(),
      now: () => NOW,
    });
    assert.equal(result.status, "INCONCLUSIVE");
    assert.equal(prompt.includes(FICTIONAL_SECRET_PHONE), false);
    assert.equal(prompt.includes(FICTIONAL_SECRET_EMAIL), false);
    assert.equal(prompt.includes("nota interna"), false);
    assert.equal(prompt.includes(FICTIONAL_LEAD.leadId), false);
    assert.equal(prompt.includes(USER_PROMPT), true);

    let calls = 0;
    const missing = await runLeadAnalysis({
      leadId: "lead_fictional_ausente",
      source: {
        async getById() {
          calls += 1;
          return null;
        },
      },
      provider: createScriptedProvider({
        respond() {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        },
      }),
      fetcher: companyPageFetcher(),
      now: () => NOW,
    });
    assert.equal(missing.status, "FAILED");
    assert.equal(missing.errorCode, "LEAD_NOT_FOUND");
    assert.equal(missing.report, null);
    assert.equal(calls, 1);
  });

  it("does not echo a provider exception into the result", async () => {
    const provider: LlmProvider = {
      model: "simulated-lead-analyst",
      complete() {
        throw new Error("Bearer sk-test-secret failed");
      },
    };
    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider,
      fetcher: companyPageFetcher(),
      now: () => NOW,
    });
    assert.equal(result.status, "FAILED");
    assert.equal(result.errorCode, "PROVIDER_ERROR");
    assert.equal(JSON.stringify(result).includes("sk-test-secret"), false);
  });

  it("blocks an open redirect to loopback inside inspectWebsite", async () => {
    const fetcher = recordingFetcher((url) => ({
      ok: true,
      kind: "redirect",
      url,
      status: 302,
      location: "http://127.0.0.1/latest/meta-data",
    }));
    const provider = createScriptedProvider({
      respond({ messages }) {
        const names = toolNames(messages);
        if (!names.includes("getLeadContext")) {
          return {
            type: "tool_calls",
            calls: [{ name: "getLeadContext", arguments: {} }],
          };
        }
        if (!names.includes("inspectWebsite")) {
          return {
            type: "tool_calls",
            calls: [
              {
                name: "inspectWebsite",
                arguments: { url: FICTIONAL_LEAD.website },
              },
            ],
          };
        }
        return { type: "final", draft: inconclusiveDraft("Redirect recusado.") };
      },
    });
    const result = await runLeadAnalysis({
      leadId: FICTIONAL_LEAD.leadId,
      source: sourceFor([FICTIONAL_LEAD]),
      provider,
      fetcher,
      now: () => NOW,
    });
    assert.equal(fetcher.calls.length, 1);
    assert.equal(fetcher.calls[0]?.includes("clinica-aurora-exemplo.test"), true);
    assert.equal(
      result.trace.some((event) => event.errorCode === "REDIRECT_BLOCKED"),
      true,
    );
    assert.equal(result.status, "INCONCLUSIVE");
  });
});

describe("evidence publication", () => {
  it("drops a cited claim that introduces a number absent from the evidence", () => {
    const memory = new AnalysisMemory();
    memory.setContext(FICTIONAL_LEAD, "fetched");
    memory.addPage({
      url: "https://clinica-aurora-exemplo.test/",
      collectedAt: "2026-11-12T15:00:00.000Z",
      text: "Agendamento pelo formulario publico.",
      excerpt: "Agendamento pelo formulario publico.",
    });
    const published = publishReport({
      draft: {
        ...completeDraft("ev_page_1"),
        opportunities: [
          {
            hypothesis: `Faturamento de ${INJECTION_MARKER}`,
            rationale: "O site publico existe.",
            evidenceIds: ["ev_page_1"],
          },
        ],
      },
      memory,
      model: "simulated-lead-analyst",
      researchedAt: "2026-11-12T15:00:00.000Z",
    });
    assert.equal(published.status, "INCONCLUSIVE");
    assert.equal(published.downgraded, true);
    assert.equal(JSON.stringify(published.report).includes(INJECTION_MARKER), false);
    assert.equal(DEFAULT_LIMITS.maxSteps > 0, true);
  });
});
