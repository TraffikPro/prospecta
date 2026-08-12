import { timingSafeEqual } from "node:crypto";

/**
 * Machine-to-machine auth for acquisition runner dispatch + callbacks.
 * Expects: Authorization: Bearer <ACQUISITION_JOB_TOKEN>
 */
export function authorizeAcquisitionJobRequest(request: Request): boolean {
  const expected = process.env.ACQUISITION_JOB_TOKEN?.trim();
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
