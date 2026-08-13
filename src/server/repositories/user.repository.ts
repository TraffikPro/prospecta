import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  canRunAcquisition: boolean;
  weeklyTarget: number | null;
};

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      canRunAcquisition: true,
      weeklyQuota: {
        select: { weeklyTarget: true },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    canRunAcquisition: user.canRunAcquisition,
    weeklyTarget: user.weeklyQuota?.weeklyTarget ?? null,
  }));
}
