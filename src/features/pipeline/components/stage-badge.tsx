"use client";

import type { LeadStage } from "@prisma/client";
import { Badge, HStack, Text } from "@chakra-ui/react";

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

type StageBadgeProps = {
  stage: LeadStage;
  count: number;
};

/** Compact stage header: label · count (color assists; text remains primary). */
export function StageBadge({ stage, count }: StageBadgeProps) {
  return (
    <HStack gap="2" align="center" flexWrap="wrap">
      <Badge
        colorPalette={STAGE_PALETTE[stage]}
        variant="subtle"
        size="sm"
        data-stage={stage}
        data-testid={`pipeline-stage-label-${stage}`}
      >
        {leadStageLabels[stage]}
      </Badge>
      <Text fontSize="sm" color="fg.muted" fontWeight="medium">
        · {count}
      </Text>
    </HStack>
  );
}
