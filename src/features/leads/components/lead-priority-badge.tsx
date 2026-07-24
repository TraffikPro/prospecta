import { Badge, HStack, Text } from "@chakra-ui/react";

import {
  qualificationColorPalette,
  type LeadQualification,
} from "@/features/leads/intelligence";
import { qualificationLabels } from "@/features/leads/lead.labels";

type LeadPriorityBadgeProps = {
  qualification: LeadQualification | null;
  score: number | null;
};

export function LeadPriorityBadge({
  qualification,
  score,
}: LeadPriorityBadgeProps) {
  if (!qualification && score == null) {
    return (
      <Text fontSize="sm" color="fg.muted">
        Sem score
      </Text>
    );
  }

  return (
    <HStack gap="2" data-testid="lead-priority-badge">
      {qualification ? (
        <Badge
          colorPalette={qualificationColorPalette(qualification)}
          variant="subtle"
          size="sm"
        >
          {qualificationLabels[qualification]}
        </Badge>
      ) : null}
      {typeof score === "number" ? (
        <Text fontSize="sm" fontWeight="medium">
          {score}
        </Text>
      ) : null}
    </HStack>
  );
}
