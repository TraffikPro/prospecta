import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const ADMIN_AUDIT_ACTIONS = {
  USER_CAN_RUN_ACQUISITION_SET: "user.can_run_acquisition.set",
} as const;

export async function createAdminAuditEvent(input: {
  action: string;
  actorId: string;
  targetUserId?: string | null;
  detail?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.adminAuditEvent.create({
    data: {
      action: input.action,
      actorId: input.actorId,
      targetUserId: input.targetUserId ?? null,
      detail: input.detail ?? undefined,
    },
  });
}
