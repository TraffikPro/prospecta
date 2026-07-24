"use client";

import { Badge, Progress, Stack, Text } from "@chakra-ui/react";

import {
  qualificationColorPalette,
  qualificationLabel,
  resolveQualification,
} from "@/features/leads/intelligence/qualification";
import type { LeadIntelligence } from "@/features/leads/intelligence/types";

type ScoreDisplayProps = {
  intelligence: LeadIntelligence;
};

export function ScoreDisplay({ intelligence }: ScoreDisplayProps) {
  const qualification = resolveQualification(intelligence);
  const score = intelligence.score;
  const palette = qualification
    ? qualificationColorPalette(qualification)
    : "brand";

  return (
    <Stack gap="3" data-testid="intelligence-score">
      <Stack direction="row" align="baseline" gap="3" flexWrap="wrap">
        {typeof score === "number" ? (
          <Text fontSize="3xl" fontWeight="bold" lineHeight="1" letterSpacing="tight">
            {score}
            <Text as="span" fontSize="md" fontWeight="medium" color="fg.muted">
              {" "}
              / 100
            </Text>
          </Text>
        ) : (
          <Text fontSize="lg" color="fg.muted">
            Score indisponível
          </Text>
        )}
        {qualification ? (
          <Badge
            colorPalette={palette}
            size="lg"
            data-testid="intelligence-qualification"
          >
            {qualification}
          </Badge>
        ) : null}
      </Stack>

      {qualification ? (
        <Text fontSize="sm" color="fg.muted">
          {qualificationLabel(qualification)}
        </Text>
      ) : null}

      {typeof score === "number" ? (
        <Progress.Root value={score} max={100} colorPalette={palette} size="sm">
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      ) : null}
    </Stack>
  );
}
