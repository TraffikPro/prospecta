export type LeadQualification = "HIGH" | "MEDIUM" | "LOW";

/** Normalized view-model for Lead.intelligence JSON. */
export type LeadIntelligence = {
  score?: number;
  qualification?: LeadQualification;
  /** Campaign slug from generator (e.g. santos-odontologia-2026-07). */
  campaign?: string;
  signals: string[];
  diagnostic?: string;
  pitch?: string;
};
