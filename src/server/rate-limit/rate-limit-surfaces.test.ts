import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createAcquisitionJobHandlers } from "@/app/api/internal/acquisition-jobs/[id]/route";
import { createLeadPostHandler } from "@/app/api/internal/leads/route";
import {
  checkLoginRateLimit,
  runAcquisitionRequestWithRateLimit,
  runForgotPasswordRequest,
  runLoginAttemptWithRateLimit,
  runResetPasswordWithRateLimit,
  runUserOperationWithRateLimit,
} from "@/server/rate-limit/server-actions";
import { RATE_LIMIT_POLICIES } from "@/server/rate-limit/policies";
import type {
  RateLimitAdapter,
  RateLimitConsumeInput,
} from "@/server/rate-limit/types";

const TEST_SECRET = "surface-rate-limit-test-secret-32-chars";
const LOOPBACK_HEADERS = new Headers({ "x-forwarded-for": "127.0.0.1" });

describe("auth rate limit surfaces", () => {
  it("runs the same login policies before user existence can matter", async () => {
    const calls: RateLimitConsumeInput[] = [];
    const adapter: RateLimitAdapter = {
      async consume(input) {
        calls.push(input);
        return {
          status: "allowed",
          limit: input.policy.limit,
          remaining: input.policy.limit - 1,
          resetAt: 60_000,
        };
      },
    };
    const dependencies = {
      adapter,
      keySecret: TEST_SECRET,
      environment: "test",
      now: () => 0,
    };

    assert.equal(
      (
        await checkLoginRateLimit(
          "existing@prospecta.test",
          LOOPBACK_HEADERS,
          dependencies,
        )
      ).status,
      "allowed",
    );
    assert.equal(
      (
        await checkLoginRateLimit(
          "missing@prospecta.test",
          LOOPBACK_HEADERS,
          dependencies,
        )
      ).status,
      "allowed",
    );
    assert.deepEqual(
      calls.map((call) => call.policy.id),
      ["login-ip", "login-email", "login-ip", "login-email"],
    );
    assert.equal(
      calls.some(
        (call) =>
          call.identifier.includes("existing") ||
          call.identifier.includes("missing") ||
          call.identifier.includes("@"),
      ),
      false,
    );
  });

  it("forgot password keeps the ack path and skips side effects when blocked", async () => {
    let requested = 0;
    await runForgotPasswordRequest({
      email: "person@prospecta.test",
      requestHeaders: LOOPBACK_HEADERS,
      isValidEmail: () => true,
      check: async () => ({ status: "limited", retryAfterSeconds: 60 }),
      requestReset: async () => {
        requested += 1;
      },
    });
    assert.equal(requested, 0);

    await runForgotPasswordRequest({
      email: " PERSON@PROSPECTA.TEST ",
      requestHeaders: LOOPBACK_HEADERS,
      isValidEmail: () => true,
      check: async () => ({ status: "allowed", degraded: false }),
      requestReset: async (email) => {
          assert.equal(email, "PERSON@PROSPECTA.TEST");
          requested += 1;
      },
    });
    assert.equal(requested, 1);
  });

  it("blocks login before database and bcrypt work", async () => {
    let expensiveWork = 0;
    const result = await runLoginAttemptWithRateLimit({
      email: "person@prospecta.test",
      requestHeaders: LOOPBACK_HEADERS,
      limitedMessage: "invalid credentials",
      check: async () => ({ status: "limited", retryAfterSeconds: 60 }),
      attempt: async () => {
        expensiveWork += 1;
        return {};
      },
    });
    assert.equal(expensiveWork, 0);
    assert.equal(result.rateLimitError, "invalid credentials");
  });

  it("blocks reset password before token lookup and mutation", async () => {
    let reset = 0;
    const result = await runResetPasswordWithRateLimit({
      requestHeaders: LOOPBACK_HEADERS,
      check: async () => ({ status: "unavailable" }),
      reset: async () => {
        reset += 1;
        return {};
      },
    });
    assert.equal(reset, 0);
    assert.ok(result.rateLimitError);
  });

  for (const [name, policy] of [
    ["change password", RATE_LIMIT_POLICIES.changePasswordUser],
    ["fill wallet", RATE_LIMIT_POLICIES.acquisitionActionUser],
  ] as const) {
    it(`blocks ${name} before expensive work or side effects`, async () => {
      let sideEffects = 0;
      const result = await runUserOperationWithRateLimit({
        userId: "user-1",
        policy,
        enforce: async () => ({ status: "limited", retryAfterSeconds: 60 }),
        operation: async () => {
          sideEffects += 1;
          return {};
        },
      });
      assert.equal(sideEffects, 0);
      assert.ok(result.rateLimitError);
    });
  }
});

describe("M2M route rate limits", () => {
  it("returns 401 without consuming a limit for invalid import Bearer", async () => {
    let consumed = 0;
    const handler = createLeadPostHandler({
      authorize: () => false,
      enforce: async () => {
        consumed += 1;
        return { status: "allowed", degraded: false };
      },
    });

    const response = await handler(
      new Request("http://localhost/api/internal/leads", { method: "POST" }),
    );
    assert.equal(response.status, 401);
    assert.equal(consumed, 0);
  });

  it("returns 429 and Retry-After for a limited authenticated import", async () => {
    let ingested = 0;
    const handler = createLeadPostHandler({
      authorize: () => true,
      enforce: async () => ({ status: "limited", retryAfterSeconds: 42 }),
      ingest: async () => {
        ingested += 1;
        return { id: "lead-1", created: true, stage: "NEW" };
      },
    });
    const response = await handler(
      new Request("http://localhost/api/internal/leads", { method: "POST" }),
    );

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "42");
    assert.equal(ingested, 0);
  });

  it("returns 401 before rate limiting invalid acquisition Bearer requests", async () => {
    let consumed = 0;
    const handlers = createAcquisitionJobHandlers({
      authorize: () => false,
      enforce: async () => {
        consumed += 1;
        return { status: "allowed", degraded: false };
      },
    });
    const context = { params: Promise.resolve({ id: "job-1" }) };

    assert.equal(
      (
        await handlers.GET(
          new Request("http://localhost/api/internal/acquisition-jobs/job-1"),
          context,
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await handlers.PATCH(
          new Request("http://localhost/api/internal/acquisition-jobs/job-1", {
            method: "PATCH",
          }),
          context,
        )
      ).status,
      401,
    );
    assert.equal(consumed, 0);
  });

  it("fails open for authenticated acquisition GET only on store unavailability", async () => {
    const handlers = createAcquisitionJobHandlers({
      authorize: () => true,
      enforce: async () => ({ status: "allowed", degraded: true }),
      findJob: async () => null,
    });
    const response = await handlers.GET(
      new Request("http://localhost/api/internal/acquisition-jobs/job-1"),
      { params: Promise.resolve({ id: "job-1" }) },
    );
    assert.equal(response.status, 404);
  });

  it("returns 429 for an exceeded acquisition GET limit", async () => {
    let queried = 0;
    const handlers = createAcquisitionJobHandlers({
      authorize: () => true,
      enforce: async () => ({ status: "limited", retryAfterSeconds: 25 }),
      findJob: async () => {
        queried += 1;
        return null;
      },
    });
    const response = await handlers.GET(
      new Request("http://localhost/api/internal/acquisition-jobs/job-1"),
      { params: Promise.resolve({ id: "job-1" }) },
    );
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "25");
    assert.equal(queried, 0);
  });

  it("fails closed for acquisition PATCH when the store is unavailable", async () => {
    let applied = 0;
    const handlers = createAcquisitionJobHandlers({
      authorize: () => true,
      enforce: async () => ({ status: "unavailable" }),
      applyCallback: async () => {
        applied += 1;
        return { id: "job-1", status: "RUNNING" };
      },
    });
    const response = await handlers.PATCH(
      new Request("http://localhost/api/internal/acquisition-jobs/job-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "RUNNING" }),
      }),
      { params: Promise.resolve({ id: "job-1" }) },
    );
    assert.equal(response.status, 503);
    assert.equal(applied, 0);
  });

  it("returns 429 and Retry-After for a limited acquisition PATCH", async () => {
    const handlers = createAcquisitionJobHandlers({
      authorize: () => true,
      enforce: async () => ({ status: "limited", retryAfterSeconds: 90 }),
    });
    const response = await handlers.PATCH(
      new Request("http://localhost/api/internal/acquisition-jobs/job-1", {
        method: "PATCH",
      }),
      { params: Promise.resolve({ id: "job-1" }) },
    );
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "90");
  });
});

describe("cost-generating acquisition action", () => {
  it("does not call the runner request when rate limited", async () => {
    let requested = 0;
    const result = await runAcquisitionRequestWithRateLimit({
      userId: "user-1",
      enforce: async () => ({ status: "limited", retryAfterSeconds: 60 }),
      request: async () => {
        requested += 1;
        return { id: "job-1" };
      },
    });

    assert.equal(requested, 0);
    assert.ok(result.rateLimitError);
  });
});
