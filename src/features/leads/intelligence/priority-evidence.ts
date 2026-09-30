import { signalLabel } from "./signal-catalog";
import type { LeadIntelligence } from "./types";

export type PriorityEvidence = {
  /** Up to 3 human-readable signal labels (catalog / humanized). */
  signalLabels: string[];
  /** Truncated diagnostic only — never pitch (outreach copy). */
  reasonLine: string | null;
  /** Compact Places source facts when present. */
  placesLine: string | null;
};

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

/**
 * Compact explainability for Prioridades rows from existing intelligence only.
 * Does not invent commercial claims.
 */
export function buildPriorityEvidence(
  intelligence: LeadIntelligence,
  options: { maxSignals?: number; maxReasonChars?: number } = {},
): PriorityEvidence {
  const maxSignals = options.maxSignals ?? 3;
  const maxReasonChars = options.maxReasonChars ?? 140;

  const signalLabels = intelligence.signals
    .slice(0, maxSignals)
    .map((code) => signalLabel(code));

  const reasonLine = intelligence.diagnostic
    ? truncate(intelligence.diagnostic, maxReasonChars)
    : null;

  const placesParts: string[] = [];
  if (typeof intelligence.rating === "number") {
    placesParts.push(
      `${intelligence.rating.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} no Google`,
    );
  }
  if (typeof intelligence.reviews === "number") {
    const noun =
      intelligence.reviews === 1 ? "avaliação" : "avaliações";
    placesParts.push(`${intelligence.reviews} ${noun}`);
  }

  return {
    signalLabels,
    reasonLine,
    placesLine: placesParts.length > 0 ? placesParts.join(" · ") : null,
  };
}
