"use client";

import { Badge, type BadgeProps } from "@chakra-ui/react";

import { qualificationColorPalette } from "@/features/leads/intelligence/qualification";
import type { LeadQualification } from "@/features/leads/intelligence/types";
import { qualificationLabels } from "@/features/leads/lead.labels";

type QualificationBadgeProps = {
  qualification: LeadQualification;
  size?: BadgeProps["size"];
};

export function QualificationBadge({
  qualification,
  size = "md",
}: QualificationBadgeProps) {
  return (
    <Badge
      colorPalette={qualificationColorPalette(qualification)}
      size={size}
      data-testid="intelligence-qualification"
    >
      {qualificationLabels[qualification]}
    </Badge>
  );
}
