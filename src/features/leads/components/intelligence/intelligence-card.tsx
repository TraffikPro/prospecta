"use client";

import { Stack, Text } from "@chakra-ui/react";

import { SectionHeading } from "@/components/layout/page-heading";
import type { LeadIntelligence } from "@/features/leads/intelligence/types";

import { PlacesEvidence } from "./places-evidence";
import { PitchBox } from "./pitch-box";
import { ScoreDisplay } from "./score-display";
import { SignalList } from "./signal-list";

type IntelligenceCardProps = {
  intelligence: LeadIntelligence;
};

/**
 * Full-record intelligence context for Lead Detail.
 * Section + border (not nested decorative cards). Score stays compact.
 */
export function IntelligenceCard({ intelligence }: IntelligenceCardProps) {
  return (
    <Stack
      as="section"
      gap="5"
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      bg="bg"
      px="4"
      py="4"
      data-testid="lead-intelligence-card"
      aria-labelledby="intelligence-heading"
    >
      <Stack gap="1">
        <SectionHeading id="intelligence-heading">
          Qualificação do lead
        </SectionHeading>
        <Text textStyle="meta">
          Evidência persistida para apoiar a abordagem — não substitui o
          histórico de contato.
        </Text>
      </Stack>

      <ScoreDisplay intelligence={intelligence} />
      <PlacesEvidence
        rating={intelligence.rating}
        reviews={intelligence.reviews}
        googleMapsUrl={intelligence.googleMapsUrl}
      />
      <SignalList signals={intelligence.signals} />

      {intelligence.diagnostic ? (
        <Stack gap="2" data-testid="intelligence-diagnostic">
          <Text fontSize="sm" fontWeight="semibold">
            Diagnóstico
          </Text>
          <Text fontSize="sm" whiteSpace="pre-wrap" color="fg">
            {intelligence.diagnostic}
          </Text>
        </Stack>
      ) : null}

      {intelligence.pitch ? <PitchBox pitch={intelligence.pitch} /> : null}
    </Stack>
  );
}
