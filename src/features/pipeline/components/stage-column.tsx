"use client";

import { useState } from "react";

import type { LeadStage } from "@prisma/client";
import { Box, SimpleGrid, Stack } from "@chakra-ui/react";

import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";

import {
  LeadStageCard,
  type LeadStageCardData,
} from "./lead-stage-card";

/** Cards shown before “Ver todos” on desktop. */
export const PIPELINE_DESKTOP_PREVIEW = 3;

type StageColumnProps = {
  stage: LeadStage;
  leads: LeadStageCardData[];
  formatFollowUp: (value: Date | string) => string;
};

export function StageColumn({
  stage,
  leads,
  formatFollowUp,
}: StageColumnProps) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = leads.length > PIPELINE_DESKTOP_PREVIEW;
  const visible =
    showAll || !hasMore ? leads : leads.slice(0, PIPELINE_DESKTOP_PREVIEW);

  return (
    <Box data-testid={`pipeline-stage-${stage}`}>
      <Stack gap="3">
        {leads.length === 0 ? (
          <AppEmptyState
            variant="compact"
            title="Nenhum lead nesta etapa."
            data-testid={`pipeline-stage-empty-${stage}`}
          />
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
              {visible.map((lead) => (
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
            {hasMore && !showAll ? (
              <Button
                type="button"
                variant="outline"
                colorPalette="gray"
                size="md"
                minH="touch"
                alignSelf="flex-start"
                onClick={() => setShowAll(true)}
                data-testid={`pipeline-show-all-${stage}`}
              >
                Ver todos ({leads.length})
              </Button>
            ) : null}
          </>
        )}
      </Stack>
    </Box>
  );
}
