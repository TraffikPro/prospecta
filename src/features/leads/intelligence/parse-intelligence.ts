import { dedupeSignals } from "./signal-catalog";
import type { LeadIntelligence, LeadQualification } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseScore(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  if (value < 0 || value > 100) {
    return undefined;
  }
  return value;
}

function parseQualification(value: unknown): LeadQualification | undefined {
  if (value === "HIGH" || value === "MEDIUM" || value === "LOW") {
    return value;
  }
  return undefined;
}

function parseSignals(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const raw = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return dedupeSignals(raw);
}

function parseText(value: unknown, max = 2000): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, max);
}

function parseRating(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  if (value < 0 || value > 5) {
    return undefined;
  }
  return value;
}

function parseReviews(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 0) {
    return undefined;
  }
  return value;
}

function parseGoogleMapsUrl(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return undefined;
    }
    return trimmed.slice(0, 2000);
  } catch {
    return undefined;
  }
}

/**
 * Adapts raw Lead.intelligence JSON into a stable view-model.
 * Returns null when there is nothing commercial to show.
 */
export function parseLeadIntelligence(raw: unknown): LeadIntelligence | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const score = parseScore(record.score);
  const qualification = parseQualification(record.qualification);
  const campaign = parseText(record.campaign, 120);
  const signals = parseSignals(record.signals);
  // Prefer diagnostic; accept legacy `summary`.
  const diagnostic =
    parseText(record.diagnostic) ?? parseText(record.summary);
  const pitch = parseText(record.pitch);
  const rating = parseRating(record.rating);
  const reviews = parseReviews(record.reviews);
  const googleMapsUrl = parseGoogleMapsUrl(record.googleMapsUrl);

  const hasContent =
    typeof score === "number" ||
    Boolean(qualification) ||
    Boolean(campaign) ||
    signals.length > 0 ||
    Boolean(diagnostic) ||
    Boolean(pitch) ||
    typeof rating === "number" ||
    typeof reviews === "number" ||
    Boolean(googleMapsUrl);

  if (!hasContent) {
    return null;
  }

  return {
    score,
    qualification,
    campaign,
    signals,
    diagnostic,
    pitch,
    rating,
    reviews,
    googleMapsUrl,
  };
}
