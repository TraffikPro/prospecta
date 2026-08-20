import { createHmac } from "node:crypto";

import { isValidRateLimitKeySecret } from "./config";
import type { RateLimitPolicy } from "./types";

const APPLICATION_PREFIX = "prospecta";

export function normalizeRateLimitEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function buildHashedIdentifier(input: {
  policy: RateLimitPolicy;
  identity: string;
  secret: string;
}): string {
  if (!isValidRateLimitKeySecret(input.secret)) {
    throw new Error("Rate limit key secret is missing or too short");
  }

  return createHmac("sha256", input.secret)
    .update(input.policy.id)
    .update("\0")
    .update(input.identity)
    .digest("hex");
}

export function rateLimitPrefix(
  environment: string,
  policy: RateLimitPolicy,
): string {
  const safeEnvironment =
    environment.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "unknown";
  return `${APPLICATION_PREFIX}:${safeEnvironment}:${policy.purpose}:${policy.id}`;
}
