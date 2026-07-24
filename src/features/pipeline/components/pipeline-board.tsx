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
      <Box display={{ base: "none", md: "block" }} data-testid="pipeline-desktop">
        <Accordion.Root
          collapsible
          multiple={false}
          defaultValue={[initialStage]}
        >
          <Stack gap="2">
            {LEAD_STAGE_ORDER.map((stage) => {
              const leads = grouped[stage];
              return (
                <Accordion.Item
                  key={stage}
                  value={stage}
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="card"
                  bg="bg"
                  px="3"
                  data-testid={`pipeline-desktop-stage-${stage}`}
                >
                  <Accordion.ItemTrigger minH="touch" py="3">
                    <Box flex="1" textAlign="left">
                      <StageBadge stage={stage} count={leads.length} />
                    </Box>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Accordion.ItemBody pb="4">
                      <StageColumn
                        stage={stage}
                        leads={leads}
                        formatFollowUp={formatFollowUp}
                      />
                    </Accordion.ItemBody>
                  </Accordion.ItemContent>
                </Accordion.Item>
              );
            })}
          </Stack>
        </Accordion.Root>
      </Box>

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
                <Accordion.ItemTrigger minH="touch" py="3">
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
