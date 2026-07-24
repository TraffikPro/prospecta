import type { UserRole } from "@prisma/client";

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  MEMBER: "Membro",
};
