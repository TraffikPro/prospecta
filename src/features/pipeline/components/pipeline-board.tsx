import type { LeadStage } from "@prisma/client";
import { Stack } from "@chakra-ui/react";

import { LEAD_STAGE_ORDER } from "@/features/leads/lead.labels";

import type { LeadStageCardData } from "./lead-stage-card";
import { StageColumn } from "./stage-column";

export type PipelineBoardData = Record<LeadStage, LeadStageCardData[]>;

type PipelineBoardProps = {
  grouped: PipelineBoardData;
  formatFollowUp: (value: Date) => string;
};

export function PipelineBoard({ grouped, formatFollowUp }: PipelineBoardProps) {
  return (
    <Stack gap="8">
      {LEAD_STAGE_ORDER.map((stage) => (
        <StageColumn
          key={stage}
          stage={stage}
          leads={grouped[stage]}
          formatFollowUp={formatFollowUp}
        />
      ))}
    </Stack>
  );
}
