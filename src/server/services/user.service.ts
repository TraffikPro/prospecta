import { prisma } from "@/lib/prisma";
import {
  ADMIN_AUDIT_ACTIONS,
  createAdminAuditEvent,
} from "@/server/repositories/admin-audit.repository";
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

export async function setUserCanRunAcquisition(input: {
  actorId: string;
  targetUserId: string;
  canRunAcquisition: boolean;
}): Promise<AdminUserRow> {
  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      canRunAcquisition: true,
    },
  });

  if (!target) {
    throw new UserPermissionError("Usuário não encontrado.");
  }

  if (target.role === "ADMIN") {
    throw new UserPermissionError(
      "Administradores já têm acesso à aquisição; não é necessário alterar esta permissão.",
    );
  }

  if (target.canRunAcquisition === input.canRunAcquisition) {
    return {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      isActive: target.isActive,
      canRunAcquisition: target.canRunAcquisition,
    };
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { canRunAcquisition: input.canRunAcquisition },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      canRunAcquisition: true,
    },
  });

  await createAdminAuditEvent({
    action: ADMIN_AUDIT_ACTIONS.USER_CAN_RUN_ACQUISITION_SET,
    actorId: input.actorId,
    targetUserId: updated.id,
    detail: {
      canRunAcquisition: updated.canRunAcquisition,
      previous: target.canRunAcquisition,
      targetEmail: updated.email,
    },
  });

  return updated;
}
