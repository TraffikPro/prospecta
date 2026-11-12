import assert from "node:assert/strict";
import { it } from "node:test";
import { createOpenAIProvider, OPENAI_MODEL } from "./openai-provider";
import { ProviderBudgetError, type LlmMessage } from "./provider";
import { toolSpecs } from "./tools";
import { runLeadAnalysis } from "./orchestrator";
import { FICTIONAL_LEAD } from "./fixtures";

const signal = () => new AbortController().signal;
const messages: LlmMessage[] = [{ role: "system", content: "Test" }, { role: "user", content: "Analyze" }];
const reply = (output: unknown[], status = "completed") => new Response(JSON.stringify({ status, output,
  usage: { input_tokens: 100, output_tokens: 50 } }), { status: 200 });
const final = (draft: unknown) => ({ type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify(draft) }] });
const inconclusive = { status: "INCONCLUSIVE", summary: null, digitalPresence: { hasPublicWebsite: "unknown", observations: [] },
  opportunities: [], insufficientInformation: ["No evidence"], limitations: ["Fixture"] };

it("uses Responses, pinned model, store:false, strict schemas, timeout and no built-in tools", async () => {
  const provider = createOpenAIProvider({ apiKey: "fake", fetch: async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, OPENAI_MODEL); assert.equal(body.store, false);
    assert.equal(body.parallel_tool_calls, false); assert.equal(body.reasoning.effort, "none");
    assert.ok(body.max_output_tokens <= 1_400); assert.equal(init?.redirect, "error"); assert.ok(init?.signal);
    assert.equal(body.text.format.strict, true);
    assert.ok(body.tools.every((tool: { type: string; strict: boolean }) => tool.type === "function" && tool.strict));
    return reply([final(inconclusive)]);
  } });
  const result = await provider.complete({ messages, tools: toolSpecs(), signal: signal() });
  assert.equal(result.type, "final"); assert.deepEqual(result.usage, { inputTokens: 100, outputTokens: 50 });
});
it("preserves assistant calls and maps long call IDs through short core aliases", async () => {
  const callId = "call_" + "a".repeat(80); let requests = 0;
  const provider = createOpenAIProvider({ apiKey: "fake", fetch: async (_, init) => {
    requests++;
    if (requests === 1) return reply([{ type: "function_call", call_id: callId, name: "getLeadContext", arguments: "{}" }]);
    const body = JSON.parse(String(init?.body));
    assert.ok(body.input.some((item: { type: string; call_id: string }) => item.type === "function_call" && item.call_id === callId));
    assert.equal(body.input.at(-1).call_id, callId);
    assert.equal(body.input.at(-1).type, "function_call_output");
    return reply([final(inconclusive)]);
  } });
  const first = await provider.complete({ messages, tools: toolSpecs(), signal: signal() });
  assert.equal(first.type, "tool_calls"); if (first.type !== "tool_calls") return;
  assert.ok(first.calls[0].id!.length < 40);
  await provider.complete({ messages: [...messages, { role: "tool", callId: first.calls[0].id!, name: "getLeadContext", content: "{}" }], tools: toolSpecs(), signal: signal() });
  assert.equal(requests, 2);
});
it("refuses insufficient cost or token budget before HTTP", async () => {
  for (const limits of [{ maxCostMicros: 1 }, { maxTokens: 1 }]) {
    let calls = 0;
    const provider = createOpenAIProvider({ apiKey: "fake", ...limits, fetch: async () => { calls++; return reply([]); } });
    await assert.rejects(provider.complete({ messages, tools: toolSpecs(), signal: signal() }), ProviderBudgetError);
    assert.equal(calls, 0);
  }
});
it("HTTP errors are sanitized and never automatically retried", async () => {
  let calls = 0;
  const provider = createOpenAIProvider({ apiKey: "fake-secret", fetch: async () => { calls++; return new Response("fake-secret", { status: 429 }); } });
  await assert.rejects(provider.complete({ messages, tools: toolSpecs(), signal: signal() }), { message: "OPENAI_HTTP_429" });
  assert.equal(calls, 1);
});
it("handles refusal/incomplete output without publishing a report", async () => {
  for (const status of ["completed", "incomplete"]) {
    const provider = createOpenAIProvider({ apiKey: "fake", fetch: async () => reply([{ type: "message", content: [{ type: "refusal", refusal: "No" }] }], status) });
    const response = await provider.complete({ messages, tools: toolSpecs(), signal: signal() });
    assert.equal(response.type === "final" && response.draft, null);
  }
});
it("enforces response size and rejects unknown tools", async () => {
  const oversized = createOpenAIProvider({ apiKey: "fake", fetch: async () => new Response("x".repeat(128_001)) });
  await assert.rejects(oversized.complete({ messages, tools: toolSpecs(), signal: signal() }), /OPENAI_RESPONSE_TOO_LARGE/);
  const unknown = createOpenAIProvider({ apiKey: "fake", fetch: async () => reply([{ type: "function_call", call_id: "x", name: "shell", arguments: "{}" }]) });
  await assert.rejects(unknown.complete({ messages, tools: toolSpecs(), signal: signal() }), /OPENAI_UNKNOWN_TOOL/);
});
it("controlled-page evaluation: adapter → core → evidence-backed report, no outside fetch", async () => {
  let turn = 0; let pages = 0;
  const provider = createOpenAIProvider({ apiKey: "fake", fetch: async () => {
    turn++;
    if (turn === 1) return reply([{ type: "function_call", call_id: "context", name: "getLeadContext", arguments: "{}" }]);
    if (turn === 2) return reply([{ type: "function_call", call_id: "page", name: "inspectWebsite", arguments: JSON.stringify({ url: FICTIONAL_LEAD.website }) }]);
    return reply([final({ ...inconclusive, status: "COMPLETE", summary: "Serviços e contato público.", digitalPresence: {
      hasPublicWebsite: true, observations: [{ statement: "A página apresenta serviços e contato.", evidenceIds: ["ev_page_1"] }],
    } })]);
  } });
  const result = await runLeadAnalysis({ leadId: FICTIONAL_LEAD.leadId, source: { getById: async () => FICTIONAL_LEAD }, provider,
    fetcher: { fetch: async ({ url }) => { pages++; return { ok: true, kind: "document", url, status: 200, text: "<p>A página apresenta serviços e contato.</p>" }; } } });
  assert.equal(result.status, "COMPLETE"); assert.equal(result.report?.evidence.length, 1); assert.equal(pages, 1); assert.equal(turn, 3);
});
it("controlled evaluation: invented evidence is downgraded; provider budget propagates", async () => {
  const provider = createOpenAIProvider({ apiKey: "fake", fetch: async () => reply([final({ ...inconclusive, status: "COMPLETE",
    digitalPresence: { hasPublicWebsite: true, observations: [{ statement: "Invented", evidenceIds: ["fake-id"] }] } })]) });
  const input = { leadId: FICTIONAL_LEAD.leadId, source: { getById: async () => FICTIONAL_LEAD },
    fetcher: { fetch: async () => ({ ok: false as const, errorCode: "UNAVAILABLE" as const }) }, limits: { maxRepairAttempts: 0 } };
  const result = await runLeadAnalysis({ ...input, provider });
  assert.equal(result.status, "INCONCLUSIVE"); assert.equal(result.report?.opportunities.length, 0);
  const stopped = await runLeadAnalysis({ ...input, provider: createOpenAIProvider({ apiKey: "fake", maxCostMicros: 1 }) });
  assert.equal(stopped.errorCode, "LIMIT_COST");
});
