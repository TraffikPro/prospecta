/** Simulation is opt-in and restricted to a local, dedicated test database. */
export function isLocalAnalysisSimulation(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.LEAD_AI_ANALYSIS_SIMULATED !== "true"
    || !["development", "test"].includes(env.NODE_ENV ?? "")
    || env.VERCEL !== undefined || env.VERCEL_ENV !== undefined) return false;
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    return ["postgres:", "postgresql:"].includes(url.protocol)
      && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      && ["/prospecta_test", "/prospecta_ci"].includes(url.pathname);
  } catch { return false; }
}
