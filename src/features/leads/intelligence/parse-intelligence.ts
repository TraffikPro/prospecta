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
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 20);
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
  const signals = parseSignals(record.signals);
  // Prefer diagnostic; accept legacy `summary`.
  const diagnostic =
    parseText(record.diagnostic) ?? parseText(record.summary);
  const pitch = parseText(record.pitch);

  const hasContent =
    typeof score === "number" ||
    Boolean(qualification) ||
    signals.length > 0 ||
    Boolean(diagnostic) ||
    Boolean(pitch);

  if (!hasContent) {
    return null;
  }

  return {
    score,
    qualification,
    signals,
    diagnostic,
    pitch,
  };
}
