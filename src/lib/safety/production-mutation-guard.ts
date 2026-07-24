import { createHash } from "node:crypto";

/**
 * Blocks mutable test/smoke helpers from touching the production database
 * or production app URL unless an explicit break-glass env is set.
 */

export const PRODUCTION_APP_HOSTS = [
  "prospecta-ten-tau.vercel.app",
] as const;

/** sha256(host).slice(0, 12) for known production Neon pooler. */
export const PRODUCTION_DB_FINGERPRINTS = [
  "50218bdd86d8",
] as const;

export const BREAK_GLASS_ENV = "PROSPECTA_ALLOW_PROD_DB_MUTATION";
export const BREAK_GLASS_VALUE = "I_UNDERSTAND_PROD_MUTATION";

export function databaseHostFingerprint(
  databaseUrl: string | undefined,
): string | null {
  if (!databaseUrl) return null;
  try {
    const host = databaseUrl.split("@")[1]?.split("/")[0];
    if (!host) return null;
    return createHash("sha256").update(host).digest("hex").slice(0, 12);
  } catch {
    return null;
  }
}

export function appHostFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

export type MutationGuardInput = {
  databaseUrl?: string;
  appUrl?: string;
  breakGlass?: string;
  /** Override for unit tests; production callers omit this. */
  knownDbFingerprints?: readonly string[];
  knownAppHosts?: readonly string[];
};

export type MutationGuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export function assertSafeForMutableTests(
  input: MutationGuardInput = {},
): MutationGuardResult {
  if (input.breakGlass === BREAK_GLASS_VALUE) {
    return { ok: true };
  }

  const blockedDbFingerprints =
    input.knownDbFingerprints ?? PRODUCTION_DB_FINGERPRINTS;
  const dbFp = databaseHostFingerprint(input.databaseUrl);
  if (dbFp && (blockedDbFingerprints as readonly string[]).includes(dbFp)) {
    return {
      ok: false,
      reason: `Refusing mutable test against production DATABASE_URL (fingerprint ${dbFp}). Use a staging/preview database, or set ${BREAK_GLASS_ENV}=${BREAK_GLASS_VALUE} only for approved hygiene.`,
    };
  }

  const blockedAppHosts = input.knownAppHosts ?? PRODUCTION_APP_HOSTS;
  const appHost = appHostFromUrl(input.appUrl);
  if (appHost && (blockedAppHosts as readonly string[]).includes(appHost)) {
    return {
      ok: false,
      reason: `Refusing mutable test against production app host ${appHost}. Point PLAYWRIGHT_BASE_URL / SMOKE_BASE_URL at localhost or preview.`,
    };
  }

  return { ok: true };
}

export function assertSafeForMutableTestsOrThrow(
  input: MutationGuardInput = {},
): void {
  const result = assertSafeForMutableTests(input);
  if (!result.ok) {
    throw new Error(result.reason);
  }
}
