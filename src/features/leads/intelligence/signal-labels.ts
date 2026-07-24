const SIGNAL_LABELS: Record<string, string> = {
  NO_WEBSITE: "Sem website identificado",
  HIGH_RATING: "Alta reputação Google",
  HIGH_REVIEWS: "Volume relevante de avaliações",
};

/** Human-readable label for a machine signal code. Unknown codes stay readable. */
export function signalLabel(signal: string): string {
  const key = signal.trim().toUpperCase();
  if (SIGNAL_LABELS[key]) {
    return SIGNAL_LABELS[key];
  }
  return signal
    .trim()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
