export type RateLimitAlgorithm = "fixed-window" | "sliding-window";

export type RateLimitFailureMode = "open" | "closed" | "acknowledge";

export type RateLimitPolicy = {
  id: string;
  purpose: string;
  algorithm: RateLimitAlgorithm;
  limit: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  windowMs: number;
  failureMode: RateLimitFailureMode;
};

export type RateLimitResult =
  | {
      status: "allowed";
      limit: number;
      remaining: number;
      resetAt: number;
    }
  | {
      status: "limited";
      limit: number;
      remaining: 0;
      resetAt: number;
    }
  | {
      status: "unavailable";
    };

export type RateLimitConsumeInput = {
  policy: RateLimitPolicy;
  identifier: string;
  environment: string;
};

export interface RateLimitAdapter {
  consume(input: RateLimitConsumeInput): Promise<RateLimitResult>;
}
