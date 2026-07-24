"use client";

import { Badge } from "@chakra-ui/react";

type StatusBadgeProps = {
  isActive: boolean;
};

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <Badge
      colorPalette={isActive ? "success" : "gray"}
      variant="subtle"
      size="sm"
    >
      {isActive ? "Ativo" : "Inativo"}
    </Badge>
  );
}
