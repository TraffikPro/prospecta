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
  const memberActorEmail = `perm-member-actor-${stamp}@prospecta.test`;
  const inactiveAdminEmail = `perm-inactive-admin-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";
  let memberActorId = "";
  let inactiveAdminId = "";

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

    const memberActor = await prisma.user.upsert({
      where: { email: memberActorEmail },
      update: {
        isActive: true,
        role: "MEMBER",
        canRunAcquisition: true,
      },
      create: {
        email: memberActorEmail,
        name: "Perm Member Actor",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("PermMemberActor123!"),
        isActive: true,
      },
    });
    memberActorId = memberActor.id;

    const inactiveAdmin = await prisma.user.upsert({
      where: { email: inactiveAdminEmail },
      update: { isActive: false, role: "ADMIN", canRunAcquisition: false },
      create: {
        email: inactiveAdminEmail,
        name: "Inactive Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("InactiveAdmin123!"),
        isActive: false,
      },
    });
    inactiveAdminId = inactiveAdmin.id;
  });

  after(async () => {
    await prisma.adminAuditEvent.deleteMany({
      where: {
        OR: [
          { actorId: { in: [adminId, memberActorId, inactiveAdminId] } },
          { targetUserId: memberId },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminId, memberId, memberActorId, inactiveAdminId] },
      },
    });
    await prisma.$disconnect();
  });

  it("ADMIN grant/revoke updates and audits atomically", async () => {
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

    const auditCount = await prisma.adminAuditEvent.count({
      where: {
        actorId: adminId,
        targetUserId: memberId,
        action: ADMIN_AUDIT_ACTIONS.USER_CAN_RUN_ACQUISITION_SET,
      },
    });
    assert.equal(auditCount, 2);
  });

  it("is idempotent when requested value is already applied", async () => {
    await setUserCanRunAcquisition({
      actorId: adminId,
      targetUserId: memberId,
      canRunAcquisition: false,
    });
    const beforeCount = await prisma.adminAuditEvent.count({
      where: {
        actorId: adminId,
        targetUserId: memberId,
        action: ADMIN_AUDIT_ACTIONS.USER_CAN_RUN_ACQUISITION_SET,
      },
    });

    const again = await setUserCanRunAcquisition({
      actorId: adminId,
      targetUserId: memberId,
      canRunAcquisition: false,
    });
    assert.equal(again.canRunAcquisition, false);

    const afterCount = await prisma.adminAuditEvent.count({
      where: {
        actorId: adminId,
        targetUserId: memberId,
        action: ADMIN_AUDIT_ACTIONS.USER_CAN_RUN_ACQUISITION_SET,
      },
    });
    assert.equal(afterCount, beforeCount);
  });

  it("rolls back permission when audit step fails", async () => {
    await prisma.user.update({
      where: { id: memberId },
      data: { canRunAcquisition: false },
    });

    await assert.rejects(
      () =>
        setUserCanRunAcquisition(
          {
            actorId: adminId,
            targetUserId: memberId,
            canRunAcquisition: true,
          },
          {
            beforeAudit: async () => {
              throw new Error("forced audit failure");
            },
          },
        ),
      /forced audit failure/,
    );

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: memberId },
    });
    assert.equal(stored.canRunAcquisition, false);
  });

  it("rejects MEMBER actor directly in the service", async () => {
    await assert.rejects(
      () =>
        setUserCanRunAcquisition({
          actorId: memberActorId,
          targetUserId: memberId,
          canRunAcquisition: true,
        }),
      (error: unknown) =>
        error instanceof UserPermissionError &&
        /apenas administradores/i.test(error.message),
    );

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: memberId },
    });
    assert.equal(stored.canRunAcquisition, false);
  });

  it("rejects missing or inactive actor", async () => {
    await assert.rejects(
      () =>
        setUserCanRunAcquisition({
          actorId: "missing-actor-id",
          targetUserId: memberId,
          canRunAcquisition: true,
        }),
      UserPermissionError,
    );

    await assert.rejects(
      () =>
        setUserCanRunAcquisition({
          actorId: inactiveAdminId,
          targetUserId: memberId,
          canRunAcquisition: true,
        }),
      UserPermissionError,
    );

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
