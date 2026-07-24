import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
  passwordResetExpiresAt,
} from "./password-reset-token";

describe("password reset token helpers", () => {
  it("generates unique high-entropy tokens", () => {
    const a = generatePasswordResetToken();
    const b = generatePasswordResetToken();
    assert.notEqual(a, b);
    assert.ok(a.length >= 32);
  });

  it("hashes tokens deterministically without storing plain form", () => {
    const token = "example-reset-token-value";
    assert.equal(hashPasswordResetToken(token), hashPasswordResetToken(token));
    assert.notEqual(hashPasswordResetToken(token), token);
  });

  it("sets expiry 30 minutes ahead", () => {
    const now = new Date("2026-07-24T12:00:00.000Z");
    const expires = passwordResetExpiresAt(now);
    assert.equal(expires.getTime() - now.getTime(), PASSWORD_RESET_TTL_MS);
  });
});
