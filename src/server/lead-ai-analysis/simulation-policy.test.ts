import assert from "node:assert/strict";
import { it } from "node:test";
import { isLocalAnalysisSimulation } from "./simulation-policy";

const local = { NODE_ENV: "development", LEAD_AI_ANALYSIS_SIMULATED: "true", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:5433/prospecta_test" } as NodeJS.ProcessEnv;
it("simulation requires explicit opt-in, local dedicated DB and development/test", () => {
  assert.equal(isLocalAnalysisSimulation(local), true);
  for (const extra of [
    { LEAD_AI_ANALYSIS_SIMULATED: undefined }, { LEAD_AI_ANALYSIS_SIMULATED: "1" },
    { NODE_ENV: "production" }, { NODE_ENV: undefined }, { VERCEL: "1" }, { VERCEL_ENV: "preview" },
    { DATABASE_URL: "postgresql://fixture:fixture@remote.example/prospecta_test" },
    { DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:5433/prospecta" },
    { DATABASE_URL: undefined }, { DATABASE_URL: "invalid" },
  ]) assert.equal(isLocalAnalysisSimulation({ ...local, ...extra } as NodeJS.ProcessEnv), false);
});
