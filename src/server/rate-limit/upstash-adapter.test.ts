import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";

import { RATE_LIMIT_POLICIES } from "./policies";
import { UpstashRateLimitAdapter } from "./upstash-adapter";

type LimitResult = Awaited<ReturnType<Ratelimit["limit"]>>;

const INPUT = {
  policy: RATE_LIMIT_POLICIES.loginIp,
  identifier: "hashed-identifier",
  environment: "test",
};
const CONFIG = {
  url: "https://fake-injected.upstash.io",
  token: "fake-token-never-sent",
};

function createAdapter(
  limit: () => Promise<LimitResult>,
): UpstashRateLimitAdapter {
  const fakeRedis = { fake: true } as unknown as Redis;
  return new UpstashRateLimitAdapter(CONFIG, {
    redis: fakeRedis,
    createLimiter: (options) => {
      assert.equal(options.redis, fakeRedis);
      assert.equal(options.analytics, false);
      assert.equal(options.ephemeralCache, false);
      assert.equal(options.timeout, 0);
      return { limit } as Pick<Ratelimit, "limit">;
    },
  });
}

function sdkResult(
  overrides: Partial<LimitResult> = {},
): LimitResult {
  return {
    success: true,
    limit: 10,
    remaining: 9,
    reset: 123_456,
    pending: Promise.resolve(),
    ...overrides,
  };
}

describe("Upstash rate limit adapter", () => {
  it("maps allowed responses including remaining and resetAt", async () => {
    const adapter = createAdapter(async () => sdkResult());
    assert.deepEqual(await adapter.consume(INPUT), {
      status: "allowed",
      limit: 10,
      remaining: 9,
      resetAt: 123_456,
    });
  });

  it("maps blocked responses and normalizes remaining to zero", async () => {
    const adapter = createAdapter(async () =>
      sdkResult({ success: false, remaining: -1, reset: 234_567 }),
    );
    assert.deepEqual(await adapter.consume(INPUT), {
      status: "limited",
      limit: 10,
      remaining: 0,
      resetAt: 234_567,
    });
  });

  it("converts the SDK timeout result to unavailable", async () => {
    const adapter = createAdapter(async () =>
      sdkResult({
        success: true,
        limit: 0,
        remaining: 0,
        reset: 0,
        reason: "timeout",
      }),
    );
    assert.deepEqual(await adapter.consume(INPUT), { status: "unavailable" });
  });

  it("converts Redis errors to unavailable without network access", async () => {
    const adapter = createAdapter(async () => {
      throw new Error("fake Redis failure");
    });
    assert.deepEqual(await adapter.consume(INPUT), { status: "unavailable" });
  });
});
