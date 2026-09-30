"use client";

import { Progress, Stack, Text } from "@chakra-ui/react";

import {
  qualificationColorPalette,
  qualificationLabel,
  resolveQualification,
} from "@/features/leads/intelligence/qualification";
import type { LeadIntelligence } from "@/features/leads/intelligence/types";

import { QualificationBadge } from "./qualification-badge";

type ScoreDisplayProps = {
  intelligence: LeadIntelligence;
};

/** Compact score context for Lead Detail — comparison lives on Prioridades. */
export function ScoreDisplay({ intelligence }: ScoreDisplayProps) {
  const qualification = resolveQualification(intelligence);
  const score = intelligence.score;
  const palette = qualification
    ? qualificationColorPalette(qualification)
    : "brand";

  return (
    <Stack gap="2" data-testid="intelligence-score">
      <Stack direction="row" align="center" gap="3" flexWrap="wrap">
        {typeof score === "number" ? (
          <Text
            fontSize="xl"
            fontWeight="semibold"
            lineHeight="1"
            letterSpacing="tight"
          >
            {score}
            <Text as="span" fontSize="sm" fontWeight="medium" color="fg.muted">
              {" "}
              / 100
            </Text>
          </Text>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            Score indisponível
          </Text>
        )}
        {qualification ? (
          <QualificationBadge qualification={qualification} size="md" />
        ) : null}
      </Stack>

      {qualification ? (
        <Text fontSize="sm" color="fg.muted">
          {qualificationLabel(qualification)}
        </Text>
      ) : null}

      {typeof score === "number" ? (
        <Progress.Root
          value={score}
          max={100}
          colorPalette={palette}
          size="xs"
          aria-hidden="true"
        >
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      ) : null}
    </Stack>
  );
}
