import type { LeadStage } from "@prisma/client";

export const LEAD_STAGE_ORDER: LeadStage[] = [
  "NEW",
  "QUALIFIED",
  "CONTACTED",
  "MEETING",
  "WON",
  "LOST",
];

export const leadStageLabels: Record<LeadStage, string> = {
  NEW: "Novo",
  QUALIFIED: "Qualificado",
  CONTACTED: "Contatado",
  MEETING: "Reunião",
  WON: "Ganho",
  LOST: "Perdido",
};
