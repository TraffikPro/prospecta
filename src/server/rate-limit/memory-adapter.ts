import type {
  RateLimitAdapter,
  RateLimitConsumeInput,
  RateLimitResult,
} from "./types";

type FixedWindowState = {
  kind: "fixed-window";
  count: number;
  resetAt: number;
};

type SlidingWindowState = {
  kind: "sliding-window";
  timestamps: number[];
};

type MemoryState = FixedWindowState | SlidingWindowState;

export class MemoryRateLimitAdapter implements RateLimitAdapter {
  private readonly state = new Map<string, MemoryState>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly runtimeEnvironment: string = process.env.NODE_ENV ??
      "development",
  ) {
    if (runtimeEnvironment === "production") {
      throw new Error("Memory rate limiting is forbidden in production");
    }
  }

  async consume(input: RateLimitConsumeInput): Promise<RateLimitResult> {
    if (input.environment === "production") {
      throw new Error("Memory rate limiting is forbidden in production");
    }

    const now = this.now();
    const key = `${input.environment}:${input.policy.id}:${input.identifier}`;

    if (input.policy.algorithm === "fixed-window") {
      return this.consumeFixedWindow(key, input, now);
    }
    return this.consumeSlidingWindow(key, input, now);
  }

  private consumeFixedWindow(
    key: string,
    input: RateLimitConsumeInput,
    now: number,
  ): RateLimitResult {
    const existing = this.state.get(key);
    const state =
      existing?.kind === "fixed-window" && existing.resetAt > now
        ? existing
        : {
            kind: "fixed-window" as const,
            count: 0,
            resetAt: now + input.policy.windowMs,
          };

    state.count += 1;
    this.state.set(key, state);
    const remaining = Math.max(input.policy.limit - state.count, 0);

    return state.count <= input.policy.limit
      ? {
          status: "allowed",
          limit: input.policy.limit,
          remaining,
          resetAt: state.resetAt,
        }
      : {
          status: "limited",
          limit: input.policy.limit,
          remaining: 0,
          resetAt: state.resetAt,
        };
  }

  private consumeSlidingWindow(
    key: string,
    input: RateLimitConsumeInput,
    now: number,
  ): RateLimitResult {
    const existing = this.state.get(key);
    const cutoff = now - input.policy.windowMs;
    const timestamps =
      existing?.kind === "sliding-window"
        ? existing.timestamps.filter((timestamp) => timestamp > cutoff)
        : [];

    if (timestamps.length >= input.policy.limit) {
      const resetAt = (timestamps[0] ?? now) + input.policy.windowMs;
      this.state.set(key, { kind: "sliding-window", timestamps });
      return {
        status: "limited",
        limit: input.policy.limit,
        remaining: 0,
        resetAt,
      };
    }

    timestamps.push(now);
    this.state.set(key, { kind: "sliding-window", timestamps });
    return {
      status: "allowed",
      limit: input.policy.limit,
      remaining: input.policy.limit - timestamps.length,
      resetAt: (timestamps[0] ?? now) + input.policy.windowMs,
    };
  }
}
