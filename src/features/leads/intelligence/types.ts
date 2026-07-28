export type LeadQualification = "HIGH" | "MEDIUM" | "LOW";

/** Normalized view-model for Lead.intelligence JSON. */
export type LeadIntelligence = {
  score?: number;
  qualification?: LeadQualification;
  /** Campaign slug from generator (e.g. santos-odontologia-2026-07). */
  campaign?: string;
  /** Canonical signal codes only (aliases resolved, deduped). */
  signals: string[];
  diagnostic?: string;
  pitch?: string;
  /** Google Places rating 0–5 when present on the payload. */
  rating?: number;
  /** Google Places review count when present on the payload. */
  reviews?: number;
  /** Public Maps URL when present on the payload. */
  googleMapsUrl?: string;
};
