import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct-horse-battery");
    assert.notEqual(hash, "correct-horse-battery");
    assert.equal(await verifyPassword("correct-horse-battery", hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });
});
