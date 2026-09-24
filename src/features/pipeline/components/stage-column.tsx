"use client";

import Link from "next/link";
import type { LeadStage } from "@prisma/client";
import { Box, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";

import {
  LeadStageCard,
  type LeadStageCardData,
} from "./lead-stage-card";

type StageColumnProps = {
  stage: LeadStage;
  leads: LeadStageCardData[];
  totalCount: number;
  selected: boolean;
  page: number;
  totalPages: number;
  formatFollowUp: (value: Date | string) => string;
};

export function StageColumn({
  stage,
  leads,
  totalCount,
  selected,
  page,
  totalPages,
  formatFollowUp,
}: StageColumnProps) {
  const hasMore = totalCount > leads.length;

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
            {!selected && hasMore ? (
              <Button
                asChild
                variant="outline"
                colorPalette="gray"
                size="md"
                minH="touch"
                alignSelf="flex-start"
                data-testid={`pipeline-show-all-${stage}`}
              >
                <Link href={`/app/pipeline?stage=${stage}&page=1`}>
                  Ver todos ({totalCount})
                </Link>
              </Button>
            ) : null}
            {selected && totalPages > 1 ? (
              <HStack justify="space-between" gap="3" flexWrap="wrap">
                {page > 1 ? (
                  <Button asChild variant="outline" colorPalette="gray" size="sm">
                    <Link href={`/app/pipeline?stage=${stage}&page=${page - 1}`}>
                      Anterior
                    </Link>
                  </Button>
                ) : (
                  <Box />
                )}
                <Text fontSize="sm" color="fg.muted">
                  Página {page} de {totalPages}
                </Text>
                {page < totalPages ? (
                  <Button asChild variant="outline" colorPalette="gray" size="sm">
                    <Link href={`/app/pipeline?stage=${stage}&page=${page + 1}`}>
                      Próxima
                    </Link>
                  </Button>
                ) : (
                  <Box />
                )}
              </HStack>
            ) : null}
          </>
        )}
      </Stack>
    </Box>
  );
}
