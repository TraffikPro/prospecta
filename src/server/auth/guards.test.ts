import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthenticationError, AuthorizationError } from "./errors";
import { requireAnyRole, requireAuth, requireRole } from "./guards";
import type { SessionUser } from "./types";

const admin: SessionUser = {
  id: "u_admin",
  name: "Admin",
  email: "admin@prospecta.test",
  role: "ADMIN",
  mustChangePassword: false,
};

const member: SessionUser = {
  id: "u_member",
  name: "Member",
  email: "comercial@prospecta.test",
  role: "MEMBER",
  mustChangePassword: false,
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
});
