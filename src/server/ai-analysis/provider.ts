import type { TokenUsage } from "./limits";

export class ProviderBudgetError extends Error {
  constructor(readonly code: "LIMIT_COST" | "LIMIT_TOKENS" | "LIMIT_STEPS") { super(code); }
}

export type JsonSchema = Record<string, unknown>;

export type LlmMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "tool"; callId: string; name: string; content: string };

export type ToolSpec = {
  name: string;
  description: string;
  parametersJsonSchema: JsonSchema;
};

export type LlmToolCall = {
  id?: string;
  name: string;
  arguments: unknown;
};

export type LlmCompletion =
  | { type: "tool_calls"; calls: LlmToolCall[]; usage?: TokenUsage }
  | { type: "final"; draft: unknown; usage?: TokenUsage };

export type LlmProvider = {
  readonly model: string;
  complete(input: {
    messages: readonly LlmMessage[];
    tools: readonly ToolSpec[];
    signal: AbortSignal;
  }): Promise<LlmCompletion>;
};

export function createScriptedProvider(options: {
  model?: string;
  respond: (input: {
    messages: readonly LlmMessage[];
    tools: readonly ToolSpec[];
  }) => LlmCompletion | Promise<LlmCompletion>;
}): LlmProvider {
  return {
    model: options.model ?? "simulated-lead-analyst",
    async complete(input) {
      if (input.signal.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError");
      }
      return options.respond({
        messages: input.messages,
        tools: input.tools,
      });
    },
  };
}

export function lastToolPayload(messages: readonly LlmMessage[]): unknown {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "tool") {
      try {
        return JSON.parse(message.content) as unknown;
      } catch {
        return null;
      }
    }
  }
  return null;
}
