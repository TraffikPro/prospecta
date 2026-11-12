/** Drops active content. Visible text, including hostile sentences, stays as data. */
export function htmlToText(raw: string, maxChars: number): string {
  const withoutActive = raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const text = withoutActive
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, Math.max(0, maxChars));
}

export function isTextContentType(value: string | null): boolean {
  if (!value) return true;
  const mime = value.split(";")[0]?.trim().toLowerCase() ?? "";
  return (
    mime === "text/html" ||
    mime === "application/xhtml+xml" ||
    mime === "text/plain"
  );
}
