import assert from "node:assert/strict";
import { it } from "node:test";
import { isAnalysisUserAllowed } from "./access-policy";
import { liveAnalysisConfigured } from "./live-policy";

const actor = { id: "pilot-user", email: "pilot@example.com" };
const env = { NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "production",
  VERCEL_PROJECT_ID: "prj_GlvFNVBzDlAwUDn1jOVKplyOi2lE",
  LEAD_AI_ANALYSIS_PRODUCTION_ENABLED: "true", LEAD_AI_ANALYSIS_PROVIDER: "openai", OPENAI_API_KEY: "fake",
  LEAD_AI_ANALYSIS_ALLOWED_USER_ID: actor.id, LEAD_AI_ANALYSIS_ALLOWED_EMAIL: actor.email,
  DATABASE_URL: "postgresql://test:test@ep-icy-sound-acawx9xd-pooler.sa-east-1.aws.neon.tech/neondb",
} as NodeJS.ProcessEnv;

it("production pilot requires both account ID and email; no administrator bypass", () => {
  assert.equal(isAnalysisUserAllowed(actor, env), true);
  assert.equal(isAnalysisUserAllowed({ ...actor, email: "someone@example.com" }, env), false);
  assert.equal(isAnalysisUserAllowed({ ...actor, id: "another-admin" }, env), false);
  assert.equal(isAnalysisUserAllowed(null, env), false);
  for (const key of ["LEAD_AI_ANALYSIS_ALLOWED_USER_ID", "LEAD_AI_ANALYSIS_ALLOWED_EMAIL"]) {
    assert.equal(isAnalysisUserAllowed(actor, { ...env, [key]: undefined }), false);
  }
  assert.equal(isAnalysisUserAllowed(actor, { NODE_ENV: "production" }), false);
});

it("production provider requires approved environment, project, database and explicit switches", () => {
  assert.equal(liveAnalysisConfigured(env), true);
  for (const key of Object.keys(env)) {
    assert.equal(liveAnalysisConfigured({ ...env, [key]: undefined }), false, key);
  }
  for (const extra of [{ VERCEL_ENV: "preview" }, { VERCEL_PROJECT_ID: "other" },
    { DATABASE_URL: "postgresql://test:test@localhost/prospecta_test" },
    { DATABASE_URL: env.DATABASE_URL!.replace("neondb", "other") }]) {
    assert.equal(liveAnalysisConfigured({ ...env, ...extra } as NodeJS.ProcessEnv), false);
  }
});
