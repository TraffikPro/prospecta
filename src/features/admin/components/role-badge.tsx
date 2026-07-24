"use client";

import type { UserRole } from "@prisma/client";
import { Badge } from "@chakra-ui/react";

const ROLE_PALETTE: Record<UserRole, "purple" | "blue"> = {
  ADMIN: "purple",
  MEMBER: "blue",
};

type RoleBadgeProps = {
  role: UserRole;
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge colorPalette={ROLE_PALETTE[role]} variant="subtle" size="sm">
      {role}
    </Badge>
  );
}
