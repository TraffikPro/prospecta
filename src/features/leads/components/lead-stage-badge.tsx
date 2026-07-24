"use client";

import type { LeadStage } from "@prisma/client";
import { Badge } from "@chakra-ui/react";

import { leadStageLabels } from "@/features/leads/lead.labels";

const STAGE_PALETTE: Record<
  LeadStage,
  "gray" | "blue" | "cyan" | "purple" | "success" | "danger"
> = {
  NEW: "gray",
  QUALIFIED: "blue",
  CONTACTED: "cyan",
  MEETING: "purple",
  WON: "success",
  LOST: "danger",
};

type LeadStageBadgeProps = {
  stage: LeadStage;
};

export function LeadStageBadge({ stage }: LeadStageBadgeProps) {
  return (
    <Badge colorPalette={STAGE_PALETTE[stage]} variant="subtle" size="sm">
      {leadStageLabels[stage]}
    </Badge>
  );
}
