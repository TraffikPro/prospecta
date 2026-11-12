import { z } from "zod";
import { ProviderBudgetError, type JsonSchema, type LlmProvider, type LlmToolCall } from "./provider";

// Pinned model and published standard pricing, reviewed 2026-11-12.
export const OPENAI_MODEL = "gpt-5.4-mini-2026-03-17";
export const OPENAI_COST = { inputMicrosPerThousand: 750, outputMicrosPerThousand: 4_500 };
export const LIVE_LIMITS = { maxDurationMs: 45_000, maxSteps: 6, maxTokens: 32_000, maxEstimatedCostMicros: 100_000 };
const ENDPOINT = "https://api.openai.com/v1/responses";
const str = { type: "string" };
const list = (items: JsonSchema): JsonSchema => ({ type: "array", items });
const obj = (properties: Record<string, JsonSchema>): JsonSchema => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false,
});
export const FINAL_SCHEMA = obj({
  status: { type: "string", enum: ["COMPLETE", "INCONCLUSIVE"] },
  summary: { type: ["string", "null"] },
  digitalPresence: obj({
    hasPublicWebsite: { anyOf: [{ type: "boolean" }, { type: "string", enum: ["unknown"] }] },
    observations: list(obj({ statement: str, evidenceIds: list(str) })),
  }),
  opportunities: list(obj({ hypothesis: str, rationale: str, evidenceIds: list(str) })),
  insufficientInformation: list(str), limitations: list(str),
});
const envelope = z.object({
  status: z.string(), output: z.array(z.record(z.unknown())),
  usage: z.object({ input_tokens: z.number().int().nonnegative(), output_tokens: z.number().int().nonnegative() }),
});

async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("OPENAI_INVALID_RESPONSE");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 128_000) { await reader.cancel(); throw new Error("OPENAI_RESPONSE_TOO_LARGE"); }
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally { reader.releaseLock(); }
}

/** One instance per run. No retries, arbitrary endpoint, built-in web search or remote tools. */
export function createOpenAIProvider(options: {
  apiKey: string;
  fetch?: typeof globalThis.fetch;
  maxCostMicros?: number;
  maxTokens?: number;
}): LlmProvider {
  if (!options.apiKey.trim()) throw new Error("OPENAI_NOT_CONFIGURED");
  const transport = options.fetch ?? globalThis.fetch;
  const budget = Math.min(options.maxCostMicros ?? LIVE_LIMITS.maxEstimatedCostMicros, LIVE_LIMITS.maxEstimatedCostMicros);
  const tokenBudget = Math.min(options.maxTokens ?? LIVE_LIMITS.maxTokens, LIVE_LIMITS.maxTokens);
  const history: Record<string, unknown>[] = [];
  const calls = new Map<string, { callId: string; name: string }>();
  let consumed = 0; let usedTokens = 0; let spent = 0; let turns = 0;
  return {
    model: OPENAI_MODEL,
    async complete({ messages, tools, signal }) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      if (++turns > LIVE_LIMITS.maxSteps) throw new ProviderBudgetError("LIMIT_STEPS");
      for (const message of messages.slice(consumed)) {
        if (message.role === "tool") {
          const call = calls.get(message.callId);
          if (!call || call.name !== message.name) throw new Error("OPENAI_TOOL_SEQUENCE");
          history.push({ type: "function_call_output", call_id: call.callId, output: message.content });
          calls.delete(message.callId);
        } else history.push({ role: message.role, content: message.content });
      }
      consumed = messages.length;
      const base = {
        model: OPENAI_MODEL, store: false, reasoning: { effort: "none" },
        input: history, parallel_tool_calls: false,
        tools: tools.map((tool) => ({ type: "function", name: tool.name, description: tool.description,
          strict: true, parameters: { ...tool.parametersJsonSchema,
            required: Object.keys((tool.parametersJsonSchema.properties ?? {}) as object) } })),
        text: { format: { type: "json_schema", name: "lead_analysis", strict: true, schema: FINAL_SCHEMA } },
      };
      // Deliberately conservative byte bound + framing allowance, not chars/4.
      const inputBound = Buffer.byteLength(JSON.stringify(base), "utf8") + 2_048;
      const inputCost = Math.ceil(inputBound * OPENAI_COST.inputMicrosPerThousand / 1_000);
      const availableOutput = Math.min(1_400, tokenBudget - usedTokens - inputBound,
        Math.floor((budget - spent - inputCost) * 1_000 / OPENAI_COST.outputMicrosPerThousand));
      if (availableOutput < 128) throw new ProviderBudgetError(
        tokenBudget - usedTokens - inputBound < 128 ? "LIMIT_TOKENS" : "LIMIT_COST",
      );
      const reserved = inputCost + Math.ceil(availableOutput * OPENAI_COST.outputMicrosPerThousand / 1_000);
      spent += reserved; // An unknown HTTP outcome is never refunded/retried.
      let response: Response;
      try {
        response = await transport(ENDPOINT, { method: "POST", redirect: "error",
          headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...base, max_output_tokens: availableOutput }),
          signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
        });
      } catch {
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        throw new Error("OPENAI_UNAVAILABLE");
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error(`OPENAI_HTTP_${response.status}`); }
      const data = envelope.parse(await boundedJson(response));
      const usage = { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens };
      usedTokens += usage.inputTokens + usage.outputTokens;
      spent += Math.ceil(usage.inputTokens * OPENAI_COST.inputMicrosPerThousand / 1_000)
        + Math.ceil(usage.outputTokens * OPENAI_COST.outputMicrosPerThousand / 1_000) - reserved;
      if (spent > budget) throw new ProviderBudgetError("LIMIT_COST");
      if (usedTokens > tokenBudget) throw new ProviderBudgetError("LIMIT_TOKENS");
      if (data.status !== "completed") return { type: "final", draft: null, usage };
      const toolCalls: LlmToolCall[] = [];
      for (const item of data.output) {
        if (item.type !== "function_call") continue;
        const call = z.object({ call_id: z.string(), name: z.string(), arguments: z.string() }).parse(item);
        if (!tools.some((tool) => tool.name === call.name)) throw new Error("OPENAI_UNKNOWN_TOOL");
        const alias = `oa_${turns}_${toolCalls.length}`;
        calls.set(alias, { callId: call.call_id, name: call.name });
        let args: unknown;
        try { args = JSON.parse(call.arguments); } catch { args = null; }
        toolCalls.push({ id: alias, name: call.name, arguments: args });
      }
      // Keep assistant tool calls (and reasoning items) for the next tool output.
      history.push(...data.output);
      if (toolCalls.length) return { type: "tool_calls", calls: toolCalls, usage };
      const text = data.output.flatMap((item) => item.type === "message" && Array.isArray(item.content) ? item.content : [])
        .filter((item) => item?.type === "output_text").map((item) => item.text).join("");
      let draft: unknown;
      try { draft = JSON.parse(text); } catch { draft = null; }
      return { type: "final", draft, usage };
    },
  };
}
