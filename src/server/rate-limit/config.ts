export const RATE_LIMIT_SECRET_MIN_LENGTH = 32;

export type UpstashRateLimitConfig = {
  url: string;
  token: string;
};

const PUBLIC_PLACEHOLDER_PATTERN =
  /^(?:replace[-_ ]?with|change[-_ ]?me|example|placeholder|your[-_ ])/i;

export function isValidRateLimitKeySecret(
  value: string | null | undefined,
): value is string {
  const secret = value?.trim() ?? "";
  if (
    secret.length < RATE_LIMIT_SECRET_MIN_LENGTH ||
    PUBLIC_PLACEHOLDER_PATTERN.test(secret)
  ) {
    return false;
  }

  return new Set(secret).size >= 10;
}

export function parseUpstashRateLimitConfig(input: {
  url?: string | null;
  token?: string | null;
}): UpstashRateLimitConfig | null {
  const url = input.url?.trim() ?? "";
  const token = input.token?.trim() ?? "";
  if (
    !url ||
    token.length < 16 ||
    PUBLIC_PLACEHOLDER_PATTERN.test(token)
  ) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.username ||
      parsedUrl.password ||
      !parsedUrl.hostname.endsWith(".upstash.io")
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, token };
}
