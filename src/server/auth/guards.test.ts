import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthenticationError, AuthorizationError } from "./errors";
import {
  canRunAcquisition,
  requireAnyRole,
  requireAuth,
  requireCanRunAcquisition,
  requireRole,
} from "./guards";
import type { SessionUser } from "./types";

const admin: SessionUser = {
  id: "u_admin",
  name: "Admin",
  email: "admin@prospecta.test",
  role: "ADMIN",
  canRunAcquisition: false,
  mustChangePassword: false,
};

const member: SessionUser = {
  id: "u_member",
  name: "Member",
  email: "comercial@prospecta.test",
  role: "MEMBER",
  canRunAcquisition: false,
  mustChangePassword: false,
};

const memberAuthorized: SessionUser = {
  ...member,
  id: "u_member_acq",
  email: "ops@prospecta.test",
  canRunAcquisition: true,
};

describe("auth guards", () => {
  it("requireAuth rejects null", () => {
    assert.throws(() => requireAuth(null), AuthenticationError);
  });

  it("requireAuth returns the user", () => {
    assert.equal(requireAuth(member).email, member.email);
  });

  it("requireRole allows ADMIN and rejects MEMBER", () => {
    assert.equal(requireRole(admin, "ADMIN").role, "ADMIN");
    assert.throws(() => requireRole(member, "ADMIN"), AuthorizationError);
  });

  it("requireAnyRole accepts listed roles", () => {
    assert.equal(requireAnyRole(member, ["ADMIN", "MEMBER"]).role, "MEMBER");
    assert.throws(() => requireAnyRole(member, ["ADMIN"]), AuthorizationError);
  });

  it("canRunAcquisition allows ADMIN regardless of flag", () => {
    assert.equal(canRunAcquisition(admin), true);
    assert.equal(canRunAcquisition({ ...admin, canRunAcquisition: false }), true);
  });

  it("canRunAcquisition allows only opted-in MEMBER", () => {
    assert.equal(canRunAcquisition(member), false);
    assert.equal(canRunAcquisition(memberAuthorized), true);
    assert.equal(canRunAcquisition(null), false);
  });

  it("requireCanRunAcquisition blocks unauthorized MEMBER", () => {
    assert.equal(requireCanRunAcquisition(admin).id, admin.id);
    assert.equal(requireCanRunAcquisition(memberAuthorized).id, memberAuthorized.id);
    assert.throws(() => requireCanRunAcquisition(member), AuthorizationError);
    assert.throws(() => requireCanRunAcquisition(null), AuthenticationError);
  });
});
