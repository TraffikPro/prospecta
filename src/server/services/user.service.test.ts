import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "@/server/auth/password";
import { ADMIN_AUDIT_ACTIONS } from "@/server/repositories/admin-audit.repository";
import {
  setUserCanRunAcquisition,
  UserPermissionError,
} from "./user.service";

const prisma = new PrismaClient();

describe("setUserCanRunAcquisition", () => {
  const stamp = Date.now();
  const adminEmail = `perm-admin-${stamp}@prospecta.test`;
  const memberEmail = `perm-member-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";

  before(async () => {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { isActive: true, role: "ADMIN", canRunAcquisition: false },
      create: {
        email: adminEmail,
        name: "Perm Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("PermAdmin123!"),
        isActive: true,
      },
    });
    adminId = admin.id;

    const member = await prisma.user.upsert({
      where: { email: memberEmail },
      update: {
        isActive: true,
        role: "MEMBER",
        canRunAcquisition: false,
      },
      create: {
        email: memberEmail,
        name: "Perm Member",
        role: "MEMBER",
        canRunAcquisition: false,
        passwordHash: await hashPassword("PermMember123!"),
        isActive: true,
      },
    });
    memberId = member.id;
  });

  after(async () => {
    await prisma.adminAuditEvent.deleteMany({
      where: { OR: [{ actorId: adminId }, { targetUserId: memberId }] },
    });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, memberId] } } });
    await prisma.$disconnect();
  });

  it("ADMIN can grant and revoke acquisition for MEMBER with audit", async () => {
    const granted = await setUserCanRunAcquisition({
      actorId: adminId,
      targetUserId: memberId,
      canRunAcquisition: true,
    });
    assert.equal(granted.canRunAcquisition, true);

    const auditGrant = await prisma.adminAuditEvent.findFirst({
      where: {
        actorId: adminId,
        targetUserId: memberId,
        action: ADMIN_AUDIT_ACTIONS.USER_CAN_RUN_ACQUISITION_SET,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(auditGrant);
    assert.equal(
      (auditGrant?.detail as { canRunAcquisition?: boolean } | null)
        ?.canRunAcquisition,
      true,
    );

    const revoked = await setUserCanRunAcquisition({
      actorId: adminId,
      targetUserId: memberId,
      canRunAcquisition: false,
    });
    assert.equal(revoked.canRunAcquisition, false);

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: memberId },
    });
    assert.equal(stored.canRunAcquisition, false);
  });

  it("rejects toggling ADMIN targets", async () => {
    await assert.rejects(
      () =>
        setUserCanRunAcquisition({
          actorId: adminId,
          targetUserId: adminId,
          canRunAcquisition: true,
        }),
      UserPermissionError,
    );
  });
});
