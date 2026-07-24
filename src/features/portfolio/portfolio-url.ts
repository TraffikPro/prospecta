/**
 * Resolve catalog preview paths to an absolute public URL.
 * Prefers NEXT_PUBLIC_APP_URL (production/canonical) over the current origin.
 */
export function toAbsolutePortfolioUrl(
  url: string,
  options?: { appUrl?: string | null; origin?: string | null },
): string {
  if (/^https?:\/\//i.test(url)) return url;

  const base = (options?.appUrl ?? options?.origin ?? "")
    .trim()
    .replace(/\/$/, "");
  if (!base) return url;

  return new URL(url.startsWith("/") ? url : `/${url}`, `${base}/`).toString();
}
