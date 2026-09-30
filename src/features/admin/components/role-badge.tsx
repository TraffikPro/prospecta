"use client";

import type { UserRole } from "@prisma/client";
import { Badge } from "@chakra-ui/react";

import { roleLabels } from "@/features/admin/role.labels";

type RoleBadgeProps = {
  role: UserRole;
};

/** Role is text-first; palette is secondary (not color-only). */
export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge
      colorPalette="gray"
      variant={role === "ADMIN" ? "solid" : "subtle"}
      size="sm"
      data-testid="admin-user-role"
      data-role={role}
    >
      {roleLabels[role]}
    </Badge>
  );
}
