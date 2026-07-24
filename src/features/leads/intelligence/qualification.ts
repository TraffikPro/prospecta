import type { LeadIntelligence, LeadQualification } from "./types";

export function qualificationFromScore(score: number): LeadQualification {
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

/** Prefer explicit qualification; otherwise derive from score. */
export function resolveQualification(
  intelligence: LeadIntelligence,
): LeadQualification | undefined {
  if (intelligence.qualification) {
    return intelligence.qualification;
  }
  if (typeof intelligence.score === "number") {
    return qualificationFromScore(intelligence.score);
  }
  return undefined;
}

export function qualificationLabel(qualification: LeadQualification): string {
  switch (qualification) {
    case "HIGH":
      return "Oportunidade alta";
    case "MEDIUM":
      return "Oportunidade média";
    case "LOW":
      return "Oportunidade baixa";
  }
}

export function qualificationColorPalette(
  qualification: LeadQualification,
): "success" | "warning" | "danger" {
  switch (qualification) {
    case "HIGH":
      return "success";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "danger";
  }
}
