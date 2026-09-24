"use client";

import type { LeadStage } from "@prisma/client";
import { Accordion, Box, Stack } from "@chakra-ui/react";

import { LEAD_STAGE_ORDER } from "@/features/leads/lead.labels";

import type { LeadStageCardData } from "./lead-stage-card";
import { StageBadge } from "./stage-badge";
import { StageColumn } from "./stage-column";

export type PipelineBoardData = Record<LeadStage, LeadStageCardData[]>;

type PipelineBoardProps = {
  grouped: PipelineBoardData;
  counts: Record<LeadStage, number>;
  selectedStage: LeadStage;
  page: number;
  totalPages: number;
};

function formatFollowUp(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function PipelineBoard({
  grouped,
  counts,
  selectedStage,
  page,
  totalPages,
}: PipelineBoardProps) {
  return (
    <>
      <Box display={{ base: "none", md: "block" }} data-testid="pipeline-desktop">
        <Accordion.Root
          key={selectedStage}
          collapsible
          multiple={false}
          defaultValue={[selectedStage]}
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
                      <StageBadge stage={stage} count={counts[stage]} />
                    </Box>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Accordion.ItemBody pb="4">
                      <StageColumn
                        stage={stage}
                        leads={leads}
                        totalCount={counts[stage]}
                        selected={stage === selectedStage}
                        page={stage === selectedStage ? page : 1}
                        totalPages={stage === selectedStage ? totalPages : 1}
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
          key={selectedStage}
          collapsible
          defaultValue={[selectedStage]}
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
                    <StageBadge stage={stage} count={counts[stage]} />
                  </Box>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody pb="4">
                    <StageColumn
                      stage={stage}
                      leads={leads}
                      totalCount={counts[stage]}
                      selected={stage === selectedStage}
                      page={stage === selectedStage ? page : 1}
                      totalPages={stage === selectedStage ? totalPages : 1}
                      formatFollowUp={formatFollowUp}
                    />
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
