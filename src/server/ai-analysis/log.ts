import { createHash } from "node:crypto";

export type AnalysisLogEventName =
  | "run_started"
  | "model_turn"
  | "tool_call"
  | "tool_result"
  | "run_finished";

export type SafeLogEvent = {
  analysisRunId: string;
  leadRef: string;
  event: AnalysisLogEventName;
  tool?: string;
  errorCode?: string;
  durationMs?: number;
  step?: number;
  status?: string;
};

export type SafeLogger = {
  emit(event: SafeLogEvent): void;
};

const SAFE_KEYS = [
  "analysisRunId",
  "leadRef",
  "event",
  "tool",
  "errorCode",
  "durationMs",
  "step",
  "status",
] as const;

export function createLeadRef(leadId: string): string {
  return createHash("sha256").update(leadId).digest("hex").slice(0, 12);
}

/** Copies only known fields so tokens, prompts and page text cannot ride along. */
export function toSafeLogEvent(input: SafeLogEvent): SafeLogEvent {
  const source: Record<string, unknown> = input;
  const event: SafeLogEvent = {
    analysisRunId: String(source.analysisRunId ?? ""),
    leadRef: String(source.leadRef ?? ""),
    event: input.event,
  };
  for (const key of SAFE_KEYS) {
    if (key === "analysisRunId" || key === "leadRef" || key === "event") {
      continue;
    }
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      if (key === "durationMs" || key === "step") {
        event[key] = value;
      }
    } else if (typeof value === "string" && value.length > 0 && value.length <= 80) {
      if (key === "tool" || key === "errorCode" || key === "status") {
        event[key] = value;
      }
    }
  }
  return event;
}

export function createSafeLogger(sink: (event: SafeLogEvent) => void): SafeLogger {
  return {
    emit(event) {
      sink(toSafeLogEvent(event));
    },
  };
}

export const noopLogger: SafeLogger = {
  emit() {
    return undefined;
  },
};
