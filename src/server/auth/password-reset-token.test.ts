import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MS,
  passwordResetExpiresAt,
} from "./password-reset-token";

describe("password reset token helpers", () => {
  it("generates unique high-entropy tokens", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    assert.notEqual(a, b);
    assert.ok(a.length >= 32);
  });

  it("hashes opaque tokens deterministically without storing plain form", () => {
    const token = "example-reset-token-value";
    assert.equal(hashResetToken(token), hashResetToken(token));
    assert.notEqual(hashResetToken(token), token);
  });

  it("sets expiry 30 minutes ahead", () => {
    const now = new Date("2026-07-24T12:00:00.000Z");
    const expires = passwordResetExpiresAt(now);
    assert.equal(expires.getTime() - now.getTime(), RESET_TOKEN_TTL_MS);
  });
});
