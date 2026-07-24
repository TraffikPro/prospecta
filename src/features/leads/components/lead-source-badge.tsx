"use client";

import type { LeadSource } from "@prisma/client";
import { Badge } from "@chakra-ui/react";

type LeadSourceBadgeProps = {
  source: LeadSource;
};

export function LeadSourceBadge({ source }: LeadSourceBadgeProps) {
  return (
    <Badge colorPalette="gray" variant="outline" size="sm">
      {source}
    </Badge>
  );
}
