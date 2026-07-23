import { timingSafeEqual } from "node:crypto";

/**
 * Machine-to-machine auth for internal lead ingestion.
 * Expects: Authorization: Bearer <PROSPECTA_IMPORT_TOKEN>
 */
export function authorizeImportRequest(request: Request): boolean {
  const expected = process.env.PROSPECTA_IMPORT_TOKEN?.trim();
  if (!expected) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return false;
  }

  const provided = header.slice("Bearer ".length).trim();
  if (!provided) {
    return false;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}
