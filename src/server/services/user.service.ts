import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ADMIN_AUDIT_ACTIONS } from "@/server/repositories/admin-audit.repository";
import {
  listUsersForAdmin,
  type AdminUserRow,
} from "@/server/repositories/user.repository";

export type { AdminUserRow };

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  return listUsersForAdmin();
}

export class UserPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserPermissionError";
  }
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  canRunAcquisition: true,
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

/** Test-only hook to force failure inside the transaction after the user update. */
export type SetAcquisitionPermissionHooks = {
  beforeAudit?: (tx: Prisma.TransactionClient) => Promise<void>;
};

function toAdminUserRow(user: UserRow): AdminUserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    canRunAcquisition: user.canRunAcquisition,
  };
}

export async function setUserCanRunAcquisition(
  input: {
    actorId: string;
    targetUserId: string;
    canRunAcquisition: boolean;
  },
  hooks?: SetAcquisitionPermissionHooks,
): Promise<AdminUserRow> {
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: input.actorId },
      select: { id: true, role: true, isActive: true },
    });

    if (!actor || !actor.isActive) {
      throw new UserPermissionError("Responsável inválido ou inativo.");
    }
    if (actor.role !== "ADMIN") {
      throw new UserPermissionError(
        "Apenas administradores podem alterar esta permissão.",
      );
    }

    const target = await tx.user.findUnique({
      where: { id: input.targetUserId },
      select: userSelect,
    });

    if (!target) {
      throw new UserPermissionError("Usuário não encontrado.");
    }

    if (target.role !== "MEMBER") {
      throw new UserPermissionError(
        "Administradores já têm acesso à aquisição; não é necessário alterar esta permissão.",
      );
    }

    if (target.canRunAcquisition === input.canRunAcquisition) {
      return toAdminUserRow(target);
    }

    const updated = await tx.user.update({
      where: { id: target.id },
      data: { canRunAcquisition: input.canRunAcquisition },
      select: userSelect,
    });

    if (hooks?.beforeAudit) {
      await hooks.beforeAudit(tx);
    }

    await tx.adminAuditEvent.create({
      data: {
        action: ADMIN_AUDIT_ACTIONS.USER_CAN_RUN_ACQUISITION_SET,
        actorId: actor.id,
        targetUserId: updated.id,
        detail: {
          canRunAcquisition: updated.canRunAcquisition,
          previous: target.canRunAcquisition,
          targetEmail: updated.email,
        },
      },
    });

    return toAdminUserRow(updated);
  });
}
