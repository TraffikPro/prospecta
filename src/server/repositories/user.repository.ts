import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}
