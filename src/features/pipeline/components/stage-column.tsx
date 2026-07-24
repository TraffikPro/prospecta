import type { LeadStage } from "@prisma/client";
import { Box, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import {
  LeadStageCard,
  type LeadStageCardData,
} from "./lead-stage-card";
import { StageBadge } from "./stage-badge";

type StageColumnProps = {
  stage: LeadStage;
  leads: LeadStageCardData[];
  formatFollowUp: (value: Date) => string;
};

export function StageColumn({
  stage,
  leads,
  formatFollowUp,
}: StageColumnProps) {
  return (
    <Box
      as="section"
      aria-labelledby={`stage-${stage}`}
      data-testid={`pipeline-stage-${stage}`}
    >
      <Stack gap="3">
        <Box id={`stage-${stage}`}>
          <StageBadge stage={stage} count={leads.length} />
        </Box>

        {leads.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            Nenhum lead nesta etapa
          </Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
            {leads.map((lead) => (
              <LeadStageCard
                key={lead.id}
                lead={lead}
                followUpLabel={
                  lead.nextFollowUpAt
                    ? formatFollowUp(lead.nextFollowUpAt)
                    : null
                }
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
}
