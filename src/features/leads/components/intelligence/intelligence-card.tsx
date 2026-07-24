"use client";

import { Alert, Card, Heading, Stack, Text } from "@chakra-ui/react";

import type { LeadIntelligence } from "@/features/leads/intelligence/types";

import { PitchBox } from "./pitch-box";
import { ScoreDisplay } from "./score-display";
import { SignalList } from "./signal-list";

type IntelligenceCardProps = {
  intelligence: LeadIntelligence;
};

export function IntelligenceCard({ intelligence }: IntelligenceCardProps) {
  return (
    <Card.Root
      variant="outline"
      borderRadius="card"
      data-testid="lead-intelligence-card"
    >
      <Card.Header pb="2">
        <Heading as="h2" size="md">
          Lead Intelligence
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Qualificação gerada para apoiar a abordagem comercial
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap="6">
          <ScoreDisplay intelligence={intelligence} />
          <SignalList signals={intelligence.signals} />

          {intelligence.diagnostic ? (
            <Stack gap="2" data-testid="intelligence-diagnostic">
              <Text fontSize="sm" fontWeight="semibold">
                Diagnóstico
              </Text>
              <Alert.Root status="info" variant="subtle">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description whiteSpace="pre-wrap">
                    {intelligence.diagnostic}
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            </Stack>
          ) : null}

          {intelligence.pitch ? <PitchBox pitch={intelligence.pitch} /> : null}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
