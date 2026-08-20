/**
 * Next.js runs register once for each server instance and waits for it before
 * accepting requests. Keep this hook validation-only: it must not create
 * clients or contact external services.
 */
export async function register(): Promise<void> {
  if (process.env.VERCEL_ENV !== "production") return;

  const { validateRuntimeEnv } = await import("./lib/env");
  validateRuntimeEnv();
}
