import {
  enforceRateLimits,
  runtimeEnvironment,
  type EnforcementDependencies,
  type RateLimitDecision,
} from "./enforcement";
import { normalizeRateLimitEmail } from "./identifier";
import { RATE_LIMIT_POLICIES } from "./policies";
import { resolveClientIp } from "./client-ip";
import { serverActionRateLimitMessage } from "./responses";
import type { RateLimitPolicy } from "./types";

export type RateLimitedOperationResult<T> = {
  result?: T;
  rateLimitError?: string;
};

const E2E_RATE_LIMIT_SCOPE_HEADER = "x-prospecta-e2e-rate-limit-scope";
const SAFE_E2E_SCOPE = /^[a-zA-Z0-9_-]{1,64}$/;

export function scopeRateLimitIdentityForE2E(
  identity: string,
  requestHeaders: Pick<Headers, "get">,
  environment = runtimeEnvironment(),
  enabled = process.env.PROSPECTA_E2E_RATE_LIMIT_SCOPING === "1",
): string {
  if (!enabled || environment === "production" || environment === "preview") {
    return identity;
  }
  const scope = requestHeaders.get(E2E_RATE_LIMIT_SCOPE_HEADER)?.trim();
  return scope && SAFE_E2E_SCOPE.test(scope)
    ? `e2e:${scope}:${identity}`
    : identity;
}

async function runRateLimitedOperation<T>(input: {
  decide: () => Promise<RateLimitDecision>;
  operation: () => Promise<T>;
  limitedMessage?: string;
}): Promise<RateLimitedOperationResult<T>> {
  const decision = await input.decide();
  const rateLimitError = serverActionRateLimitMessage(
    decision,
    input.limitedMessage,
  );
  if (rateLimitError) return { rateLimitError };
  return { result: await input.operation() };
}

export async function checkLoginRateLimit(
  emailRaw: string,
  requestHeaders: Pick<Headers, "get">,
  dependencies?: EnforcementDependencies,
): Promise<RateLimitDecision> {
  const ip = resolveClientIp(requestHeaders);
  if (!ip) return { status: "unavailable" };
  const environment = dependencies?.environment ?? runtimeEnvironment();

  return enforceRateLimits(
    [
      {
        policy: RATE_LIMIT_POLICIES.loginIp,
        identity: scopeRateLimitIdentityForE2E(
          ip,
          requestHeaders,
          environment,
        ),
      },
      {
        policy: RATE_LIMIT_POLICIES.loginEmail,
        identity: scopeRateLimitIdentityForE2E(
          normalizeRateLimitEmail(emailRaw) || "invalid-email",
          requestHeaders,
          environment,
        ),
      },
    ],
    dependencies,
  );
}

export async function checkForgotPasswordRateLimit(
  emailRaw: string,
  requestHeaders: Pick<Headers, "get">,
  dependencies?: EnforcementDependencies,
): Promise<RateLimitDecision> {
  const ip = resolveClientIp(requestHeaders);
  if (!ip) return { status: "unavailable" };
  const environment = dependencies?.environment ?? runtimeEnvironment();

  return enforceRateLimits(
    [
      {
        policy: RATE_LIMIT_POLICIES.forgotPasswordIp,
        identity: scopeRateLimitIdentityForE2E(
          ip,
          requestHeaders,
          environment,
        ),
      },
      {
        policy: RATE_LIMIT_POLICIES.forgotPasswordIdentity,
        identity: scopeRateLimitIdentityForE2E(
          normalizeRateLimitEmail(emailRaw) || "invalid-email",
          requestHeaders,
          environment,
        ),
      },
    ],
    dependencies,
  );
}

export async function checkResetPasswordRateLimit(
  requestHeaders: Pick<Headers, "get">,
  dependencies?: EnforcementDependencies,
): Promise<RateLimitDecision> {
  const ip = resolveClientIp(requestHeaders);
  if (!ip) return { status: "unavailable" };
  const environment = dependencies?.environment ?? runtimeEnvironment();
  return enforceRateLimits(
    [
      {
        policy: RATE_LIMIT_POLICIES.resetPasswordIp,
        identity: scopeRateLimitIdentityForE2E(
          ip,
          requestHeaders,
          environment,
        ),
      },
    ],
    dependencies,
  );
}

export async function runForgotPasswordRequest(input: {
  email: string;
  requestHeaders: Pick<Headers, "get">;
  isValidEmail: (email: string) => boolean;
  requestReset: (email: string) => Promise<void>;
  check?: () => Promise<RateLimitDecision>;
}): Promise<void> {
  const decision = input.check
    ? await input.check()
    : await checkForgotPasswordRateLimit(input.email, input.requestHeaders);
  if (decision.status !== "allowed" || !input.isValidEmail(input.email)) return;
  await input.requestReset(input.email.trim());
}

export function runLoginAttemptWithRateLimit<T>(input: {
  email: string;
  requestHeaders: Pick<Headers, "get">;
  attempt: () => Promise<T>;
  check?: () => Promise<RateLimitDecision>;
  limitedMessage: string;
}): Promise<RateLimitedOperationResult<T>> {
  return runRateLimitedOperation({
    decide: input.check
      ? input.check
      : () => checkLoginRateLimit(input.email, input.requestHeaders),
    operation: input.attempt,
    limitedMessage: input.limitedMessage,
  });
}

export function runResetPasswordWithRateLimit<T>(input: {
  requestHeaders: Pick<Headers, "get">;
  reset: () => Promise<T>;
  check?: () => Promise<RateLimitDecision>;
}): Promise<RateLimitedOperationResult<T>> {
  return runRateLimitedOperation({
    decide: input.check
      ? input.check
      : () => checkResetPasswordRateLimit(input.requestHeaders),
    operation: input.reset,
  });
}

export function runUserOperationWithRateLimit<T>(input: {
  userId: string;
  policy: RateLimitPolicy;
  operation: () => Promise<T>;
  enforce?: () => Promise<RateLimitDecision>;
}): Promise<RateLimitedOperationResult<T>> {
  return runRateLimitedOperation({
    decide: input.enforce
      ? input.enforce
      : () =>
          enforceRateLimits([
            { policy: input.policy, identity: input.userId },
          ]),
    operation: input.operation,
  });
}

export async function runAcquisitionRequestWithRateLimit<T>(input: {
  userId: string;
  request: () => Promise<T>;
  enforce?: () => Promise<RateLimitDecision>;
}): Promise<RateLimitedOperationResult<T>> {
  return runUserOperationWithRateLimit({
    userId: input.userId,
    policy: RATE_LIMIT_POLICIES.acquisitionActionUser,
    operation: input.request,
    enforce: input.enforce,
  });
}
