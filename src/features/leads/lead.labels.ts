import type { LeadSource, LeadStage } from "@prisma/client";

import type { LeadQualification } from "@/features/leads/intelligence/types";

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

/** Critical UI labels only (Visual Foundation v1). */
export const leadSourceLabels: Record<LeadSource, string> = {
  GOOGLE_PLACES: "Google Places",
  MANUAL: "Manual",
  REFERRAL: "Indicação",
  IMPORT: "Importação",
};

export const qualificationLabels: Record<LeadQualification, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};
