import type { LeadStage } from "@prisma/client";
import { leadStageLabels } from "./lead.labels";

export type StageChangePayload = {
  from: LeadStage;
  to: LeadStage;
};

export function buildStageChangeBody(
  from: LeadStage,
  to: LeadStage,
): string {
  const payload: StageChangePayload = { from, to };
  return JSON.stringify(payload);
}

export function parseStageChangeBody(
  body: string | null | undefined,
): StageChangePayload | null {
  if (!body) {
    return null;
  }
  try {
    const parsed = JSON.parse(body) as Partial<StageChangePayload>;
    if (
      typeof parsed.from === "string" &&
      typeof parsed.to === "string" &&
      parsed.from in leadStageLabels &&
      parsed.to in leadStageLabels
    ) {
      return {
        from: parsed.from as LeadStage,
        to: parsed.to as LeadStage,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function formatStageChangeSummary(
  body: string | null | undefined,
): string {
  const parsed = parseStageChangeBody(body);
  if (!parsed) {
    return body?.trim() || "Mudança de etapa";
  }
  return `${leadStageLabels[parsed.from]} → ${leadStageLabels[parsed.to]}`;
}
