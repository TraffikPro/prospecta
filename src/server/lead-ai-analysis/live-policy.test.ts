import assert from "node:assert/strict";
import { it } from "node:test";
import { liveAnalysisConfigured } from "./live-policy";

it("live integration requires explicit local configuration and remains blocked in production", () => {
  const env = { NODE_ENV: "test", OPENAI_API_KEY: "fake", LEAD_AI_ANALYSIS_PROVIDER: "openai", DATABASE_URL: "postgresql://test:test@localhost/prospecta_test" } as NodeJS.ProcessEnv;
  assert.equal(liveAnalysisConfigured(env), true);
  for (const extra of [{ NODE_ENV: "production" }, { OPENAI_API_KEY: undefined }, { LEAD_AI_ANALYSIS_PROVIDER: undefined },
    { VERCEL_ENV: "preview" }, { DATABASE_URL: "postgresql://test:test@neon.example/prospecta_test" }, { DATABASE_URL: "postgresql://test:test@localhost/prospecta" }]) {
    assert.equal(liveAnalysisConfigured({ ...env, ...extra } as NodeJS.ProcessEnv), false);
  }
});
