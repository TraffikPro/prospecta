import {
  normalizeSignalCode,
  signalLabel,
  technicalSignalCodes,
} from "./signal-catalog";

export type SanitizeNotesContext = {
  signals?: string[];
  diagnostic?: string;
  pitch?: string;
  score?: number;
  rating?: number;
  reviews?: number;
};

const STRUCTURED_PAIR = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+)/g;

function normalizeComparable(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function stripTechnicalCodes(text: string): string {
  let result = text;
  for (const code of technicalSignalCodes()) {
    const pattern = new RegExp(`\\b${code}\\b`, "gi");
    result = result.replace(pattern, " ");
  }
  return result.replace(/[ \t]{2,}/g, " ").trim();
}

function parseStructuredNotes(
  notes: string,
): { fields: Record<string, string>; isStructured: boolean } {
  const trimmed = notes.trim();
  const fields: Record<string, string> = {};
  let matchCount = 0;

  for (const match of trimmed.matchAll(STRUCTURED_PAIR)) {
    matchCount += 1;
    const key = match[1]?.toLowerCase() ?? "";
    const value = match[2]?.trim() ?? "";
    if (key && value) {
      fields[key] = value;
    }
  }

  // Treat as structured only when the bulk of the string is key=value pairs.
  const withoutPairs = trimmed
    .replace(STRUCTURED_PAIR, " ")
    .replace(/[;\s]+/g, "")
    .trim();
  const isStructured = matchCount > 0 && withoutPairs.length === 0;

  return { fields, isStructured };
}

function reasonToLabel(reason: string): string | null {
  const normalized = normalizeSignalCode(reason);
  if (normalized === "NO_WEBSITE" || /sem\s*website|no\s*website|without\s*website/i.test(reason)) {
    return signalLabel("NO_WEBSITE");
  }
  const cleaned = stripTechnicalCodes(reason);
  return cleaned || null;
}

function labelAlreadyInSignals(
  label: string,
  signalSet: Set<string>,
): boolean {
  for (const code of signalSet) {
    if (signalLabel(code) === label) {
      return true;
    }
  }
  return false;
}

function structuredToReadable(
  fields: Record<string, string>,
  context: SanitizeNotesContext,
): string[] {
  const lines: string[] = [];
  const signalSet = new Set(
    (context.signals ?? []).map((s) => normalizeSignalCode(s)),
  );

  // Skip rating/reviews when already shown in the intelligence evidence block.
  if (typeof context.rating !== "number" && fields.rating) {
    lines.push(`Nota Google: ${fields.rating.replace(".", ",")} de 5`);
  }
  if (typeof context.reviews !== "number" && fields.reviews) {
    lines.push(`${fields.reviews} avaliações`);
  }

  const reason = fields.reason ?? fields.motivo;
  if (reason) {
    const label = reasonToLabel(reason);
    if (label && !labelAlreadyInSignals(label, signalSet)) {
      lines.push(label);
    }
  }

  for (const [key, value] of Object.entries(fields)) {
    if (
      key === "rating" ||
      key === "reviews" ||
      key === "reason" ||
      key === "motivo"
    ) {
      continue;
    }
    const cleaned = stripTechnicalCodes(value);
    if (cleaned) {
      lines.push(`${key}: ${cleaned}`);
    }
  }

  return lines;
}

function isDuplicateLine(line: string, context: SanitizeNotesContext): boolean {
  const comparable = normalizeComparable(line);
  if (!comparable) {
    return true;
  }

  // Score / priority already shown in the intelligence header — drop the whole line.
  // Matches: "Score: 90/100 (HIGH)", "90/100", "HIGH", "Prioridade alta", etc.
  if (isScoreOrPriorityLine(comparable)) {
    return true;
  }

  if (context.diagnostic && comparable === normalizeComparable(context.diagnostic)) {
    return true;
  }

  if (context.pitch) {
    const pitch = normalizeComparable(context.pitch);
    if (
      comparable === pitch ||
      comparable === normalizeComparable(`Pitch: ${context.pitch}`)
    ) {
      return true;
    }
  }

  for (const signal of context.signals ?? []) {
    if (comparable === normalizeComparable(signalLabel(signal))) {
      return true;
    }
  }

  return false;
}

/** True when the line only restates score or qualification already in the UI. */
function isScoreOrPriorityLine(comparable: string): boolean {
  if (/^(?:high|medium|low)$/i.test(comparable)) {
    return true;
  }
  if (/^(?:prioridade|oportunidade)\s+(?:alta|m[eé]dia|baixa)$/i.test(comparable)) {
    return true;
  }
  // Score: 90/100 | Score: 90/100 (HIGH) | 90/100 (medium)
  if (
    /^(?:score\s*:\s*)?\d{1,3}\s*\/\s*100(?:\s*\(\s*(?:high|medium|low)\s*\))?$/i.test(
      comparable,
    )
  ) {
    return true;
  }
  // Score: 90/100 — HIGH | Score 90/100 HIGH
  if (
    /^score\s*:?\s*\d{1,3}\s*\/\s*100(?:\s*[—\-–:]?\s*(?:high|medium|low))?$/i.test(
      comparable,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Display-only sanitization: strip technical codes, structured Places noise,
 * and content already shown in intelligence / signals.
 */
export function sanitizeLeadNotes(
  notes: string | null | undefined,
  context: SanitizeNotesContext = {},
): string | null {
  if (!notes?.trim()) {
    return null;
  }

  const trimmed = notes.trim();
  const { fields, isStructured } = parseStructuredNotes(trimmed);

  let lines: string[];

  if (isStructured) {
    lines = structuredToReadable(fields, context);
  } else {
    lines = trimmed
      .split(/\r?\n/)
      .map((line) => stripTechnicalCodes(line))
      .map((line) => line.replace(/^[\s:;,\-–—]+|[\s:;,\-–—]+$/g, "").trim())
      .filter((line) => line.length > 0);
  }

  const kept = lines.filter((line) => !isDuplicateLine(line, context));

  if (kept.length === 0) {
    return null;
  }

  return kept.join("\n");
}
