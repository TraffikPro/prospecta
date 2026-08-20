import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseAppEnv } from "./env";

const BASE_ENV = {
  DATABASE_URL: "postgresql://local-test-only",
  AUTH_SECRET: "auth-test-secret-at-least-32-characters",
  NODE_ENV: "test" as const,
};

describe("application environment", () => {
  it("accepts development without Upstash configuration", () => {
    const env = parseAppEnv({ ...BASE_ENV, NODE_ENV: "development" });
    assert.equal(env.UPSTASH_REDIS_REST_URL, undefined);
  });

  it("accepts valid Vercel production rate limit configuration", () => {
    const env = parseAppEnv({
      ...BASE_ENV,
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "test-token-not-used",
      RATE_LIMIT_KEY_SECRET: "valid-production-like-secret-with-32-chars",
    });
    assert.equal(env.VERCEL_ENV, "production");
  });

  it("rejects missing production rate limit configuration", () => {
    assert.throws(
      () =>
        parseAppEnv({
          ...BASE_ENV,
          NODE_ENV: "production",
          VERCEL_ENV: "production",
        }),
      /UPSTASH_REDIS_REST_URL.*RATE_LIMIT_KEY_SECRET/,
    );
  });

  it("rejects partial production configuration without exposing values", () => {
    const exposedToken = "do-not-expose-this-token";
    assert.throws(
      () =>
        parseAppEnv({
          ...BASE_ENV,
          NODE_ENV: "production",
          VERCEL_ENV: "production",
          UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
          UPSTASH_REDIS_REST_TOKEN: exposedToken,
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message.includes(exposedToken), false);
        return true;
      },
    );
  });
});
