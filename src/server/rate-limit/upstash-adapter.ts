import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type { UpstashRateLimitConfig } from "./config";
import { rateLimitPrefix } from "./identifier";
import type {
  RateLimitAdapter,
  RateLimitConsumeInput,
  RateLimitResult,
} from "./types";

const REDIS_TIMEOUT_MS = 800;

type RateLimiter = Pick<Ratelimit, "limit">;

export type UpstashRateLimitDependencies = {
  redis?: Redis;
  createLimiter?: (
    config: ConstructorParameters<typeof Ratelimit>[0],
  ) => RateLimiter;
};

export class UpstashRateLimitAdapter implements RateLimitAdapter {
  private readonly redis: Redis;
  private readonly createLimiter: NonNullable<
    UpstashRateLimitDependencies["createLimiter"]
  >;
  private readonly limiters = new Map<string, RateLimiter>();

  constructor(
    config: UpstashRateLimitConfig,
    dependencies: UpstashRateLimitDependencies = {},
  ) {
    if (!config.url.trim() || !config.token.trim()) {
      throw new Error("Upstash rate limit configuration is missing");
    }

    this.redis =
      dependencies.redis ??
      new Redis({
        url: config.url,
        token: config.token,
        signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
      });
    this.createLimiter =
      dependencies.createLimiter ?? ((options) => new Ratelimit(options));
  }

  async consume(input: RateLimitConsumeInput): Promise<RateLimitResult> {
    try {
      const limiter = this.getLimiter(input);
      const result = await limiter.limit(input.identifier);

      if (result.reason === "timeout") {
        return { status: "unavailable" };
      }

      return result.success
        ? {
            status: "allowed",
            limit: result.limit,
            remaining: result.remaining,
            resetAt: result.reset,
          }
        : {
            status: "limited",
            limit: result.limit,
            remaining: 0,
            resetAt: result.reset,
          };
    } catch {
      return { status: "unavailable" };
    }
  }

  private getLimiter(input: RateLimitConsumeInput): RateLimiter {
    const prefix = rateLimitPrefix(input.environment, input.policy);
    const existing = this.limiters.get(prefix);
    if (existing) return existing;

    const limiter = this.createLimiter({
      redis: this.redis,
      limiter:
        input.policy.algorithm === "sliding-window"
          ? Ratelimit.slidingWindow(input.policy.limit, input.policy.window)
          : Ratelimit.fixedWindow(input.policy.limit, input.policy.window),
      prefix,
      analytics: false,
      ephemeralCache: false,
      timeout: 0,
    });
    this.limiters.set(prefix, limiter);
    return limiter;
  }
}
