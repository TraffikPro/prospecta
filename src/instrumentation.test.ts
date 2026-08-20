import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { register } from "./instrumentation";

const ENV_NAMES = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NODE_ENV",
  "VERCEL_ENV",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RATE_LIMIT_KEY_SECRET",
] as const;
const ORIGINAL_ENV = Object.fromEntries(
  ENV_NAMES.map((name) => [name, process.env[name]]),
);

afterEach(() => {
  for (const name of ENV_NAMES) {
    const original = ORIGINAL_ENV[name];
    if (original === undefined) Reflect.deleteProperty(process.env, name);
    else Reflect.set(process.env, name, original);
  }
});

function setBaseEnvironment(): void {
  process.env.DATABASE_URL = "postgresql://local-test-only";
  process.env.AUTH_SECRET = "auth-test-secret-at-least-32-characters";
  Reflect.set(process.env, "NODE_ENV", "production");
}

describe("server instrumentation environment validation", () => {
  it("does not require Upstash outside Vercel production", async () => {
    setBaseEnvironment();
    process.env.VERCEL_ENV = "preview";

    await register();
  });

  it("fails before serving when Vercel production configuration is missing", async () => {
    setBaseEnvironment();
    process.env.VERCEL_ENV = "production";

    await assert.rejects(register, /UPSTASH_REDIS_REST_URL/);
  });

  it("accepts valid Vercel production configuration without network access", async () => {
    setBaseEnvironment();
    process.env.VERCEL_ENV = "production";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token-never-used-for-network";
    process.env.RATE_LIMIT_KEY_SECRET =
      "valid-production-like-secret-with-32-chars";

    await register();
  });
});
