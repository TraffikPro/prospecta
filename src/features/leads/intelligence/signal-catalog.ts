/**
 * Single source of truth for commercial signal codes and UI labels.
 * Internal codes stay in storage/API; UI uses labels only.
 */

export const CANONICAL_SIGNALS = [
  "NO_WEBSITE",
  "HIGH_RATING",
  "HIGH_REVIEWS",
] as const;

export type CanonicalSignal = (typeof CANONICAL_SIGNALS)[number];

/** Aliases from generator / legacy payloads → canonical code. */
const SIGNAL_ALIASES: Record<string, CanonicalSignal> = {
  HIGH_REPUTATION: "HIGH_RATING",
  HIGH_GOOGLE_RATING: "HIGH_RATING",
  ALTA_REPUTACAO: "HIGH_RATING",
  NO_SITE: "NO_WEBSITE",
  SEM_WEBSITE: "NO_WEBSITE",
  WITHOUT_WEBSITE: "NO_WEBSITE",
  MANY_REVIEWS: "HIGH_REVIEWS",
  HIGH_REVIEW_COUNT: "HIGH_REVIEWS",
};

const SIGNAL_LABELS: Record<CanonicalSignal, string> = {
  NO_WEBSITE: "Website não identificado",
  HIGH_RATING: "Alta reputação no Google",
  HIGH_REVIEWS: "Volume relevante de avaliações",
};

function toSignalKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "_");
}

/** Normalize a raw signal token to a canonical (or uppercased) code. */
export function normalizeSignalCode(raw: string): string {
  const key = toSignalKey(raw);
  if (!key) {
    return "";
  }
  return SIGNAL_ALIASES[key] ?? key;
}

/** All codes that should never appear raw in commercial UI text. */
export function technicalSignalCodes(): string[] {
  const aliases = Object.keys(SIGNAL_ALIASES);
  return [...CANONICAL_SIGNALS, ...aliases];
}

/**
 * Deduplicate after alias normalization. Preserves first-seen order.
 */
export function dedupeSignals(signals: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of signals) {
    const code = normalizeSignalCode(raw);
    if (!code || seen.has(code)) {
      continue;
    }
    seen.add(code);
    result.push(code);
  }

  return result.slice(0, 20);
}

/** Human-readable label for a machine signal code. */
export function signalLabel(signal: string): string {
  const code = normalizeSignalCode(signal);
  if (code in SIGNAL_LABELS) {
    return SIGNAL_LABELS[code as CanonicalSignal];
  }
  // Readable fallback for unknown codes — never show SCREAMING_SNAKE as-is.
  const humanized = code
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
  return humanized || "Sinal não catalogado";
}

export function isCanonicalSignal(code: string): code is CanonicalSignal {
  return (CANONICAL_SIGNALS as readonly string[]).includes(code);
}
