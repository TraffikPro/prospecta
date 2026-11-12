/** Explicit production pilot, pinned to its approved project and database. */
export function isProductionAnalysisConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NODE_ENV !== "production" || env.VERCEL !== "1" || env.VERCEL_ENV !== "production"
    || env.LEAD_AI_ANALYSIS_PRODUCTION_ENABLED !== "true"
    || env.VERCEL_PROJECT_ID !== "prj_GlvFNVBzDlAwUDn1jOVKplyOi2lE"
    || !env.LEAD_AI_ANALYSIS_ALLOWED_USER_ID?.trim() || !env.LEAD_AI_ANALYSIS_ALLOWED_EMAIL?.trim()) return false;
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    return ["postgres:", "postgresql:"].includes(url.protocol)
      && url.hostname === "ep-icy-sound-acawx9xd-pooler.sa-east-1.aws.neon.tech"
      && (!url.port || url.port === "5432") && url.pathname === "/neondb";
  } catch { return false; }
}

export function liveAnalysisConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.LEAD_AI_ANALYSIS_PROVIDER === "openai" && env.OPENAI_API_KEY?.trim()
    && isProductionAnalysisConfigured(env)) return true;
  if (env.LEAD_AI_ANALYSIS_PROVIDER !== "openai" || !env.OPENAI_API_KEY?.trim()
    || !["development", "test"].includes(env.NODE_ENV ?? "")
    || env.VERCEL !== undefined || env.VERCEL_ENV !== undefined) return false;
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    return ["postgres:", "postgresql:"].includes(url.protocol)
      && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      && ["/prospecta_test", "/prospecta_ci"].includes(url.pathname);
  } catch { return false; }
}
