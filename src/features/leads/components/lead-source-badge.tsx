"use client";

import type { LeadSource } from "@prisma/client";
import { Badge } from "@chakra-ui/react";

import { leadSourceLabels } from "@/features/leads/lead.labels";

type LeadSourceBadgeProps = {
  source: LeadSource;
};

export function LeadSourceBadge({ source }: LeadSourceBadgeProps) {
  return (
    <Badge colorPalette="gray" variant="outline" size="sm">
      {leadSourceLabels[source]}
    </Badge>
  );
}
