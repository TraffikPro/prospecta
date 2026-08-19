import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";

import { normalizeClientIp, resolveClientIp } from "./client-ip";
import { isValidRateLimitKeySecret } from "./config";
import {
  enforceRateLimits,
  getDefaultAdapter,
  type RateLimitLogEvent,
} from "./enforcement";
import {
  buildHashedIdentifier,
  normalizeRateLimitEmail,
  rateLimitPrefix,
} from "./identifier";
import { MemoryRateLimitAdapter } from "./memory-adapter";
import { RATE_LIMIT_POLICIES } from "./policies";
import type { RateLimitAdapter, RateLimitPolicy } from "./types";
import { UpstashRateLimitAdapter } from "./upstash-adapter";

const TEST_SECRET = "rate-limit-test-secret-at-least-32-chars";
const ENV_NAMES = [
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

function testPolicy(
  overrides: Partial<RateLimitPolicy> = {},
): RateLimitPolicy {
  return {
    id: "test-fixed",
    purpose: "test",
    algorithm: "fixed-window",
    limit: 2,
    window: "1 m",
    windowMs: 60_000,
    failureMode: "closed",
    ...overrides,
  };
}

describe("central rate limit policies", () => {
  it("keeps approved algorithms, limits, windows, and failure modes", () => {
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(RATE_LIMIT_POLICIES).map(([name, policy]) => [
          name,
          [
            policy.algorithm,
            policy.limit,
            policy.window,
            policy.failureMode,
          ],
        ]),
      ),
      {
        loginIp: ["sliding-window", 10, "15 m", "closed"],
        loginEmail: ["sliding-window", 10, "15 m", "closed"],
        forgotPasswordIp: ["sliding-window", 5, "30 m", "acknowledge"],
        forgotPasswordIdentity: [
          "sliding-window",
          5,
          "30 m",
          "acknowledge",
        ],
        resetPasswordIp: ["sliding-window", 5, "30 m", "closed"],
        changePasswordUser: ["sliding-window", 5, "30 m", "closed"],
        importClient: ["fixed-window", 120, "5 m", "closed"],
        acquisitionGetClient: ["fixed-window", 60, "15 m", "open"],
        acquisitionPatchClient: ["fixed-window", 60, "15 m", "closed"],
        acquisitionPatchJob: ["fixed-window", 15, "15 m", "closed"],
        acquisitionActionUser: ["fixed-window", 3, "1 h", "closed"],
      },
    );
  });
});

describe("memory rate limit adapter", () => {
  it("allows below the limit, blocks above it, and expires without sleeps", async () => {
    let now = 1_000;
    const adapter = new MemoryRateLimitAdapter(() => now, "test");
    const policy = testPolicy();
    const input = {
      policy,
      identifier: "hashed-a",
      environment: "test",
    };

    assert.equal((await adapter.consume(input)).status, "allowed");
    assert.equal((await adapter.consume(input)).status, "allowed");
    assert.equal((await adapter.consume(input)).status, "limited");

    now += policy.windowMs;
    assert.equal((await adapter.consume(input)).status, "allowed");
  });

  it("implements deterministic sliding expiration", async () => {
    let now = 10_000;
    const adapter = new MemoryRateLimitAdapter(() => now, "test");
    const policy = testPolicy({
      id: "test-sliding",
      algorithm: "sliding-window",
    });
    const input = {
      policy,
      identifier: "hashed-a",
      environment: "test",
    };

    assert.equal((await adapter.consume(input)).status, "allowed");
    now += 10_000;
    assert.equal((await adapter.consume(input)).status, "allowed");
    assert.equal((await adapter.consume(input)).status, "limited");
    now += 50_001;
    assert.equal((await adapter.consume(input)).status, "allowed");
  });

  it("isolates policies and identifiers", async () => {
    const adapter = new MemoryRateLimitAdapter(() => 5_000, "test");
    const a = testPolicy({ id: "policy-a", limit: 1 });
    const b = testPolicy({ id: "policy-b", limit: 1 });

    assert.equal(
      (
        await adapter.consume({
          policy: a,
          identifier: "user-a",
          environment: "test",
        })
      ).status,
      "allowed",
    );
    assert.equal(
      (
        await adapter.consume({
          policy: a,
          identifier: "user-b",
          environment: "test",
        })
      ).status,
      "allowed",
    );
    assert.equal(
      (
        await adapter.consume({
          policy: b,
          identifier: "user-a",
          environment: "test",
        })
      ).status,
      "allowed",
    );
  });

  it("does not trivially exceed the limit under concurrent calls", async () => {
    const adapter = new MemoryRateLimitAdapter(() => 5_000, "test");
    const policy = testPolicy({ limit: 10 });
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        adapter.consume({
          policy,
          identifier: "same-user",
          environment: "test",
        }),
      ),
    );

    assert.equal(
      results.filter((result) => result.status === "allowed").length,
      10,
    );
    assert.equal(
      results.filter((result) => result.status === "limited").length,
      10,
    );
  });

  it("is forbidden for production", async () => {
    assert.throws(
      () => new MemoryRateLimitAdapter(Date.now, "production"),
      /forbidden/,
    );
    const adapter = new MemoryRateLimitAdapter(Date.now, "test");
    await assert.rejects(
      () =>
        adapter.consume({
          policy: testPolicy(),
          identifier: "hashed",
          environment: "production",
        }),
      /forbidden/,
    );
  });
});

describe("rate limit identifiers and IP", () => {
  it("normalizes email and hashes identifiers without PII", () => {
    const email = " Person+Tag@Example.COM ";
    const normalized = normalizeRateLimitEmail(email);
    const identifier = buildHashedIdentifier({
      policy: RATE_LIMIT_POLICIES.loginEmail,
      identity: normalized,
      secret: TEST_SECRET,
    });
    const prefix = rateLimitPrefix("Preview/Branch", RATE_LIMIT_POLICIES.loginEmail);

    assert.equal(normalized, "person+tag@example.com");
    assert.match(identifier, /^[a-f0-9]{64}$/);
    assert.equal(identifier.includes("person"), false);
    assert.equal(identifier.includes("@"), false);
    assert.equal(prefix, "prospecta:preview-branch:login:login-email");
  });

  it("trusts Vercel forwarding only in the confirmed runtime", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.10",
      "x-forwarded-for": "198.51.100.8",
    });
    assert.equal(
      resolveClientIp(headers, { isVercel: true, nodeEnv: "production" }),
      "203.0.113.10",
    );
    assert.equal(
      resolveClientIp(headers, { isVercel: false, nodeEnv: "production" }),
      null,
    );
  });

  it("allows only loopback forwarding in local development and has no shared fallback", () => {
    assert.equal(
      resolveClientIp(new Headers(), {
        isVercel: false,
        nodeEnv: "development",
      }),
      null,
    );
    assert.equal(
      resolveClientIp(new Headers({ "x-forwarded-for": "127.0.0.1" }), {
        isVercel: false,
        nodeEnv: "development",
      }),
      "127.0.0.1",
    );
    assert.equal(
      resolveClientIp(new Headers({ "x-forwarded-for": "203.0.113.10" }), {
        isVercel: false,
        nodeEnv: "development",
      }),
      null,
    );
  });

  it("normalizes IPv6 identities to canonical /64 prefixes", () => {
    assert.equal(
      normalizeClientIp("2001:db8:abcd:12::1"),
      normalizeClientIp("2001:0db8:abcd:0012:ffff:eeee:dddd:cccc"),
    );
    assert.notEqual(
      normalizeClientIp("2001:db8:abcd:12::1"),
      normalizeClientIp("2001:db8:abcd:13::1"),
    );
    assert.equal(
      normalizeClientIp("2001:db8::1"),
      normalizeClientIp("2001:0db8:0000:0000:0000:0000:0000:0001"),
    );
  });

  it("preserves IPv4 and treats mapped IPv6 as the same IPv4 identity", () => {
    assert.equal(normalizeClientIp("198.51.100.8"), "198.51.100.8");
    assert.equal(normalizeClientIp("::ffff:198.51.100.8"), "198.51.100.8");
    assert.equal(normalizeClientIp("::ffff:c633:6408"), "198.51.100.8");
  });

  it("uses the first forwarded IP after trimming and rejects invalid values", () => {
    assert.equal(
      resolveClientIp(
        new Headers({
          "x-vercel-forwarded-for": " 2001:db8:abcd:12::9 , 198.51.100.8 ",
        }),
        { isVercel: true, nodeEnv: "production" },
      ),
      "2001:db8:abcd:12::/64",
    );
    assert.equal(
      resolveClientIp(
        new Headers({ "x-vercel-forwarded-for": "not-an-ip, 198.51.100.8" }),
        { isVercel: true, nodeEnv: "production" },
      ),
      null,
    );
    assert.equal(normalizeClientIp("2001:db8:::1"), null);
    assert.equal(normalizeClientIp("fe80::1%eth0"), null);
  });

  it("rejects the public env placeholder as a key secret", () => {
    const envExample = readFileSync(".env.example", "utf8");
    const match = envExample.match(/^RATE_LIMIT_KEY_SECRET="(.*)"$/m);
    assert.ok(match);
    assert.equal(isValidRateLimitKeySecret(match[1]), false);
  });
});

describe("default adapter selection", () => {
  function clearUpstashConfig() {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.RATE_LIMIT_KEY_SECRET;
  }

  it("uses memory without Upstash only in development and test", () => {
    clearUpstashConfig();
    assert.ok(getDefaultAdapter("development") instanceof MemoryRateLimitAdapter);
    assert.ok(getDefaultAdapter("test") instanceof MemoryRateLimitAdapter);
    assert.equal(getDefaultAdapter("preview"), null);
    assert.equal(getDefaultAdapter("production"), null);
  });

  it("prioritizes VERCEL_ENV preview over local NODE_ENV", () => {
    clearUpstashConfig();
    Reflect.set(process.env, "NODE_ENV", "development");
    process.env.VERCEL_ENV = "preview";
    assert.equal(getDefaultAdapter(), null);
  });

  it("does not accept partial or copied placeholder configuration", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    assert.equal(getDefaultAdapter("production"), null);

    process.env.UPSTASH_REDIS_REST_TOKEN = "replace-with-upstash-rest-token";
    assert.equal(getDefaultAdapter("preview"), null);
  });

  it("selects Upstash for a complete valid remote configuration without connecting", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token-not-used-by-this-test";
    assert.ok(getDefaultAdapter("production") instanceof UpstashRateLimitAdapter);
  });

  it("enforces with memory and a local-only key secret when dev config is absent", async () => {
    clearUpstashConfig();
    const decision = await enforceRateLimits(
      [
        {
          policy: RATE_LIMIT_POLICIES.loginIp,
          identity: "development-client",
        },
      ],
      { environment: "development", logger: { warn() {} } },
    );
    assert.deepEqual(decision, { status: "allowed", degraded: false });
  });

  it("does not provide a key or memory fallback to preview", async () => {
    clearUpstashConfig();
    const decision = await enforceRateLimits(
      [
        {
          policy: RATE_LIMIT_POLICIES.acquisitionPatchClient,
          identity: "preview-client",
        },
      ],
      { environment: "preview", logger: { warn() {} } },
    );
    assert.deepEqual(decision, { status: "unavailable" });
  });
});

describe("central failure policy", () => {
  const unavailableAdapter: RateLimitAdapter = {
    async consume() {
      return { status: "unavailable" };
    },
  };

  it("fails closed when configuration is absent", async () => {
    const decision = await enforceRateLimits(
      [{ policy: RATE_LIMIT_POLICIES.loginIp, identity: "127.0.0.1" }],
      { adapter: null, keySecret: TEST_SECRET, environment: "test" },
    );
    assert.equal(decision.status, "unavailable");
  });

  it("fails closed for protected writes when the store is unavailable", async () => {
    const decision = await enforceRateLimits(
      [{ policy: RATE_LIMIT_POLICIES.importClient, identity: "client" }],
      {
        adapter: unavailableAdapter,
        keySecret: TEST_SECRET,
        environment: "test",
      },
    );
    assert.equal(decision.status, "unavailable");
  });

  it("fails open only for acquisition GET when the store is unavailable", async () => {
    const decision = await enforceRateLimits(
      [
        {
          policy: RATE_LIMIT_POLICIES.acquisitionGetClient,
          identity: "client",
        },
      ],
      {
        adapter: unavailableAdapter,
        keySecret: TEST_SECRET,
        environment: "test",
      },
    );
    assert.deepEqual(decision, { status: "allowed", degraded: true });
  });

  it("logs only safe operational fields for fail-open and fail-closed decisions", async () => {
    const events: RateLimitLogEvent[] = [];
    const logger = { warn: (event: RateLimitLogEvent) => events.push(event) };

    await enforceRateLimits(
      [{ policy: RATE_LIMIT_POLICIES.loginIp, identity: "sensitive-ip" }],
      {
        adapter: unavailableAdapter,
        keySecret: TEST_SECRET,
        environment: "production",
        logger,
      },
    );
    await enforceRateLimits(
      [
        {
          policy: RATE_LIMIT_POLICIES.acquisitionGetClient,
          identity: "sensitive-runner",
        },
      ],
      {
        adapter: unavailableAdapter,
        keySecret: TEST_SECRET,
        environment: "production",
        logger,
      },
    );

    assert.deepEqual(events, [
      {
        policyId: "login-ip",
        decision: "unavailable",
        failureMode: "fail-closed",
        environment: "production",
        category: "store",
      },
      {
        policyId: "acquisition-get-client",
        decision: "degraded",
        failureMode: "fail-open",
        environment: "production",
        category: "store",
      },
    ]);
    const serialized = JSON.stringify(events);
    assert.equal(serialized.includes("sensitive"), false);
    assert.equal(serialized.includes(TEST_SECRET), false);
  });

  it("does not log on a healthy decision", async () => {
    const events: RateLimitLogEvent[] = [];
    const allowedAdapter: RateLimitAdapter = {
      async consume(input) {
        return {
          status: "allowed",
          limit: input.policy.limit,
          remaining: input.policy.limit - 1,
          resetAt: 60_000,
        };
      },
    };
    const decision = await enforceRateLimits(
      [{ policy: RATE_LIMIT_POLICIES.loginIp, identity: "127.0.0.1" }],
      {
        adapter: allowedAdapter,
        keySecret: TEST_SECRET,
        environment: "test",
        now: () => 0,
        logger: { warn: (event) => events.push(event) },
      },
    );
    assert.deepEqual(decision, { status: "allowed", degraded: false });
    assert.deepEqual(events, []);
  });

  it("uses the longest positive Retry-After across combined policies", async () => {
    const adapter: RateLimitAdapter = {
      async consume(input) {
        return {
          status: "limited",
          limit: input.policy.limit,
          remaining: 0,
          resetAt:
            input.policy.id === "acquisition-patch-client" ? 100_500 : 140_100,
        };
      },
    };
    const decision = await enforceRateLimits(
      [
        {
          policy: RATE_LIMIT_POLICIES.acquisitionPatchClient,
          identity: "client",
        },
        { policy: RATE_LIMIT_POLICIES.acquisitionPatchJob, identity: "job" },
      ],
      {
        adapter,
        keySecret: TEST_SECRET,
        environment: "test",
        now: () => 100_000,
      },
    );
    assert.deepEqual(decision, {
      status: "limited",
      retryAfterSeconds: 41,
    });
  });

  it("keeps Retry-After positive when the reported reset is in the past", async () => {
    const adapter: RateLimitAdapter = {
      async consume(input) {
        return {
          status: "limited",
          limit: input.policy.limit,
          remaining: 0,
          resetAt: 1,
        };
      },
    };
    const decision = await enforceRateLimits(
      [{ policy: RATE_LIMIT_POLICIES.loginIp, identity: "client" }],
      {
        adapter,
        keySecret: TEST_SECRET,
        environment: "test",
        now: () => 10_000,
      },
    );
    assert.deepEqual(decision, {
      status: "limited",
      retryAfterSeconds: 1,
    });
  });
});
