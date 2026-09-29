import { createHash, randomBytes } from "node:crypto";

/**
 * Opaque password-reset *tokens* (high-entropy secrets), not user passwords.
 * User passwords are hashed with bcrypt in `./password.ts`.
 * SHA-256 is appropriate for storing/comparing opaque reset tokens.
 */
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function passwordResetExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}
