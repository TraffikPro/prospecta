const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** Formats a canonical KPI rate (`0..1`) for display. Does not persist. */
export function formatPercent(rate: number): string {
  return percentFormatter.format(rate);
}

/** Maps a canonical rate (`0..1`) onto a 0–100 progress control. */
export function rateToProgressValue(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) {
    return 0;
  }
  if (rate >= 1) {
    return 100;
  }
  return Math.round(rate * 100);
}
