"use client";

import type { LeadStage } from "@prisma/client";
import { Accordion, Box, Stack, Text } from "@chakra-ui/react";
import { useMemo } from "react";

import { LEAD_STAGE_ORDER } from "@/features/leads/lead.labels";

import type { LeadStageCardData } from "./lead-stage-card";
import { LeadStageCard } from "./lead-stage-card";
import { StageBadge } from "./stage-badge";
import { StageColumn } from "./stage-column";

export type PipelineBoardData = Record<LeadStage, LeadStageCardData[]>;

type PipelineBoardProps = {
  grouped: PipelineBoardData;
};

function formatFollowUp(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function pickInitialStage(grouped: PipelineBoardData): LeadStage {
  for (const stage of LEAD_STAGE_ORDER) {
    if (grouped[stage].length > 0) {
      return stage;
    }
  }
  return LEAD_STAGE_ORDER[0]!;
}

export function PipelineBoard({ grouped }: PipelineBoardProps) {
  const initialStage = useMemo(() => pickInitialStage(grouped), [grouped]);

  return (
    <>
      <Stack
        gap="8"
        display={{ base: "none", md: "flex" }}
        data-testid="pipeline-desktop"
      >
        {LEAD_STAGE_ORDER.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            leads={grouped[stage]}
            formatFollowUp={formatFollowUp}
          />
        ))}
      </Stack>

      <Box display={{ base: "block", md: "none" }} data-testid="pipeline-mobile">
        <Accordion.Root
          collapsible
          defaultValue={[initialStage]}
          multiple={false}
        >
          {LEAD_STAGE_ORDER.map((stage) => {
            const leads = grouped[stage];
            return (
              <Accordion.Item
                key={stage}
                value={stage}
                data-testid={`pipeline-mobile-stage-${stage}`}
              >
                <Accordion.ItemTrigger minH="11" py="3">
                  <Box flex="1" textAlign="left">
                    <StageBadge stage={stage} count={leads.length} />
                  </Box>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody pb="4">
                    {leads.length === 0 ? (
                      <Text fontSize="sm" color="fg.muted">
                        Nenhum lead nesta etapa
                      </Text>
                    ) : (
                      <Stack gap="3">
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
                      </Stack>
                    )}
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      </Box>
    </>
  );
}
