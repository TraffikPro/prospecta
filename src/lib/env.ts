import { z } from "zod";

import {
  isValidRateLimitKeySecret,
  parseUpstashRateLimitConfig,
} from "@/server/rate-limit/config";

export const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(32),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    VERCEL_ENV: z
      .enum(["development", "preview", "production"])
      .optional(),
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    RATE_LIMIT_KEY_SECRET: z.string().optional(),
  })
  .superRefine((env, context) => {
    if (env.VERCEL_ENV !== "production") return;

    if (
      !parseUpstashRateLimitConfig({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["UPSTASH_REDIS_REST_URL"],
        message: "valid distributed rate limit store configuration is required",
      });
    }

    if (!isValidRateLimitKeySecret(env.RATE_LIMIT_KEY_SECRET)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RATE_LIMIT_KEY_SECRET"],
        message: "valid dedicated rate limit key secret is required",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;
let cached: AppEnv | null = null;

export function parseAppEnv(input: unknown): AppEnv {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  return parsed.data;
}

export function getEnv(): AppEnv {
  if (cached) {
    return cached;
  }

  cached = parseAppEnv({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    RATE_LIMIT_KEY_SECRET: process.env.RATE_LIMIT_KEY_SECRET,
  });
  return cached;
}
