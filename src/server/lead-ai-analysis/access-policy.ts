/** Server-side pilot gate; production is closed unless both identity fields match. */
export function isAnalysisUserAllowed(
  actor: { id: string; email: string } | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!actor) return false;
  const id = env.LEAD_AI_ANALYSIS_ALLOWED_USER_ID?.trim();
  const email = env.LEAD_AI_ANALYSIS_ALLOWED_EMAIL?.trim().toLowerCase();
  if (id || email || env.NODE_ENV === "production" || env.VERCEL !== undefined || env.VERCEL_ENV !== undefined) {
    return Boolean(id && email && actor.id === id && actor.email.trim().toLowerCase() === email);
  }
  return env.NODE_ENV === "test" || env.NODE_ENV === "development";
}
