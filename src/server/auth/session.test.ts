import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INVALID_CREDENTIALS_MESSAGE } from "./errors";
import { isSessionExpired } from "./session-expiry";

describe("session expiry", () => {
  it("treats past expiresAt as expired", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const expiresAt = new Date("2026-07-23T11:59:59.000Z");
    assert.equal(isSessionExpired(expiresAt, now), true);
  });

  it("treats future expiresAt as active", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const expiresAt = new Date("2026-07-23T12:00:01.000Z");
    assert.equal(isSessionExpired(expiresAt, now), false);
  });
});

describe("login error message", () => {
  it("uses a generic credentials message", () => {
    assert.equal(INVALID_CREDENTIALS_MESSAGE, "Credenciais inválidas.");
  });
});
