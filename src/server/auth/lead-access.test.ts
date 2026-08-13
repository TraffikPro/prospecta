import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthorizationError } from "./errors";
import { assertCanAccessLead } from "./lead-access";

describe("assertCanAccessLead", () => {
  it("allows ADMIN on any lead and MEMBER on own lead", () => {
    assert.doesNotThrow(() =>
      assertCanAccessLead(
        { ownerId: "u1" },
        { id: "admin", role: "ADMIN" },
      ),
    );
    assert.doesNotThrow(() =>
      assertCanAccessLead(
        { ownerId: "u1" },
        { id: "u1", role: "MEMBER" },
      ),
    );
  });

  it("forbids MEMBER on another owner's lead", () => {
    assert.throws(
      () =>
        assertCanAccessLead(
          { ownerId: "u1" },
          { id: "u2", role: "MEMBER" },
        ),
      AuthorizationError,
    );
  });
});
