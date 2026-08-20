import { buildHashedIdentifier } from "./identifier";
import {
  isValidRateLimitKeySecret,
  parseUpstashRateLimitConfig,
} from "./config";
import { MemoryRateLimitAdapter } from "./memory-adapter";
import type {
  RateLimitAdapter,
  RateLimitPolicy,
  RateLimitResult,
} from "./types";
import { UpstashRateLimitAdapter } from "./upstash-adapter";

export type RateLimitCheck = {
  policy: RateLimitPolicy;
  identity: string;
};

export type RateLimitDecision =
  | { status: "allowed"; degraded: boolean }
  | { status: "limited"; retryAfterSeconds: number }
  | { status: "unavailable" };

export type RateLimitLogEvent = {
  policyId: string;
  decision: "degraded" | "unavailable";
  failureMode: "fail-open" | "fail-closed";
  environment: string;
  category: "configuration" | "store";
};

export type RateLimitLogger = {
  warn(event: RateLimitLogEvent): void;
};

export type EnforcementDependencies = {
  adapter?: RateLimitAdapter | null;
  environment?: string;
  keySecret?: string;
  now?: () => number;
  logger?: RateLimitLogger;
};

const defaultLogger: RateLimitLogger = {
  warn(event) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[rate-limit]", event);
    }
  },
};

let remoteAdapter:
  | {
      url: string;
      token: string;
      adapter: RateLimitAdapter;
    }
  | undefined;
const memoryAdapters = new Map<string, RateLimitAdapter>();
const LOCAL_RATE_LIMIT_KEY_SECRET =
  "prospecta-local-rate-limit-key-secret-not-for-remote-use";

export function runtimeEnvironment(): string {
  return (
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV?.trim() ||
    "development"
  );
}

export function getDefaultAdapter(
  environment = runtimeEnvironment(),
): RateLimitAdapter | null {
  const config = parseUpstashRateLimitConfig({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  if (config) {
    if (
      !remoteAdapter ||
      remoteAdapter.url !== config.url ||
      remoteAdapter.token !== config.token
    ) {
      remoteAdapter = {
        ...config,
        adapter: new UpstashRateLimitAdapter(config),
      };
    }
    return remoteAdapter.adapter;
  }

  if (environment === "production" || environment === "preview") return null;
  if (environment === "test") {
    return new MemoryRateLimitAdapter(Date.now, environment);
  }
  const existing = memoryAdapters.get(environment);
  if (existing) return existing;
  const adapter = new MemoryRateLimitAdapter(Date.now, environment);
  memoryAdapters.set(environment, adapter);
  return adapter;
}

function resolveKeySecret(
  environment: string,
  configuredSecret: string | undefined,
): string | undefined {
  if (configuredSecret?.trim()) return configuredSecret.trim();
  return environment === "production" || environment === "preview"
    ? undefined
    : LOCAL_RATE_LIMIT_KEY_SECRET;
}

function retryAfterSeconds(resetAt: number, now: number): number {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export async function enforceRateLimits(
  checks: readonly RateLimitCheck[],
  dependencies: EnforcementDependencies = {},
): Promise<RateLimitDecision> {
  const environment = dependencies.environment ?? runtimeEnvironment();
  const adapter =
    dependencies.adapter === undefined
      ? getDefaultAdapter(environment)
      : dependencies.adapter;
  const keySecret =
    dependencies.keySecret ??
    resolveKeySecret(environment, process.env.RATE_LIMIT_KEY_SECRET);
  const now = dependencies.now?.() ?? Date.now();
  const logger = dependencies.logger ?? defaultLogger;

  if (
    !adapter ||
    !isValidRateLimitKeySecret(keySecret) ||
    checks.some((check) => !check.identity)
  ) {
    const failOpen = checks.every(
      (check) => check.policy.failureMode === "open",
    );
    for (const check of checks) {
      logger.warn({
        policyId: check.policy.id,
        decision: failOpen ? "degraded" : "unavailable",
        failureMode:
          check.policy.failureMode === "open" ? "fail-open" : "fail-closed",
        environment,
        category: "configuration",
      });
    }
    return failOpen
      ? { status: "allowed", degraded: true }
      : { status: "unavailable" };
  }

  const results = await Promise.all(
    checks.map(async (check): Promise<RateLimitResult> => {
      try {
        const identifier = buildHashedIdentifier({
          policy: check.policy,
          identity: check.identity,
          secret: keySecret,
        });
        return await adapter.consume({
          policy: check.policy,
          identifier,
          environment,
        });
      } catch {
        return { status: "unavailable" };
      }
    }),
  );

  const limited = results.filter(
    (result): result is Extract<RateLimitResult, { status: "limited" }> =>
      result.status === "limited",
  );
  if (limited.length > 0) {
    return {
      status: "limited",
      retryAfterSeconds: Math.max(
        ...limited.map((result) => retryAfterSeconds(result.resetAt, now)),
      ),
    };
  }

  const unavailableClosed = results.some(
    (result, index) =>
      result.status === "unavailable" &&
      checks[index]?.policy.failureMode !== "open",
  );
  if (unavailableClosed) {
    results.forEach((result, index) => {
      if (result.status !== "unavailable") return;
      const policy = checks[index]!.policy;
      logger.warn({
        policyId: policy.id,
        decision: "unavailable",
        failureMode:
          policy.failureMode === "open" ? "fail-open" : "fail-closed",
        environment,
        category: "store",
      });
    });
    return { status: "unavailable" };
  }

  results.forEach((result, index) => {
    if (result.status !== "unavailable") return;
    const policy = checks[index]!.policy;
    logger.warn({
      policyId: policy.id,
      decision: "degraded",
      failureMode: "fail-open",
      environment,
      category: "store",
    });
  });

  return {
    status: "allowed",
    degraded: results.some((result) => result.status === "unavailable"),
  };
}
