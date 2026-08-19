import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuthorizationError } from "./errors";
import {
  assertCanAccessLead,
  duplicateLeadIdForActor,
  leadListScopeForViewer,
} from "./lead-access";
import type { SessionUser } from "./types";

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

describe("duplicateLeadIdForActor", () => {
  it("reveals the id to ADMIN and to the owner MEMBER", () => {
    assert.equal(
      duplicateLeadIdForActor(
        { id: "lead-b", ownerId: "u-b" },
        { id: "admin", role: "ADMIN" },
      ),
      "lead-b",
    );
    assert.equal(
      duplicateLeadIdForActor(
        { id: "lead-a", ownerId: "u-a" },
        { id: "u-a", role: "MEMBER" },
      ),
      "lead-a",
    );
  });

  it("does not reveal another owner's id to MEMBER", () => {
    assert.equal(
      duplicateLeadIdForActor(
        { id: "lead-b", ownerId: "u-b" },
        { id: "u-a", role: "MEMBER" },
      ),
      undefined,
    );
  });
});

describe("leadListScopeForViewer", () => {
  const admin: SessionUser = {
    id: "admin",
    name: "Admin",
    email: "admin@prospecta.test",
    role: "ADMIN",
    canRunAcquisition: true,
    mustChangePassword: false,
  };
  const memberA: SessionUser = {
    id: "member-a",
    name: "Member A",
    email: "a@prospecta.test",
    role: "MEMBER",
    canRunAcquisition: false,
    mustChangePassword: false,
  };

  it("gives ADMIN explicit global access", () => {
    assert.deepEqual(leadListScopeForViewer(admin), { access: "all" });
  });

  it("scopes MEMBER to own ownerId", () => {
    assert.deepEqual(leadListScopeForViewer(memberA), {
      access: "owner",
      ownerId: "member-a",
    });
  });

  it("MEMBER list filter excludes another owner's id, company, stage and source", () => {
    const rows = [
      {
        id: "lead-a",
        ownerId: "member-a",
        companyName: "Empresa Alpha",
        stage: "NEW",
        source: "MANUAL",
      },
      {
        id: "lead-b",
        ownerId: "member-b",
        companyName: "Empresa Beta",
        stage: "QUALIFIED",
        source: "GOOGLE_PLACES",
      },
    ];
    const scope = leadListScopeForViewer(memberA);
    const visible =
      scope.access === "owner"
        ? rows.filter((row) => row.ownerId === scope.ownerId)
        : rows;
    const payload = JSON.stringify(visible);
    assert.equal(visible.length, 1);
    assert.equal(visible[0]?.id, "lead-a");
    assert.equal(payload.includes("lead-b"), false);
    assert.equal(payload.includes("Empresa Beta"), false);
    assert.equal(payload.includes("QUALIFIED"), false);
    assert.equal(payload.includes("GOOGLE_PLACES"), false);

    const adminVisible =
      leadListScopeForViewer(admin).access === "all" ? rows : [];
    assert.equal(adminVisible.length, 2);
  });
});
