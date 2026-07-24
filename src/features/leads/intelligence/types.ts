export type LeadQualification = "HIGH" | "MEDIUM" | "LOW";

/** Normalized view-model for Lead.intelligence JSON. */
export type LeadIntelligence = {
  score?: number;
  qualification?: LeadQualification;
  signals: string[];
  diagnostic?: string;
  pitch?: string;
};
