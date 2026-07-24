"use client";

import { Card, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { buildLeadDetailHref } from "@/components/navigation";
import type { IntelligenceInboxLead } from "@/features/leads/intelligence/inbox";

import { PitchPreview } from "./pitch-preview";
import { QualificationBadge } from "./qualification-badge";
import { SignalTag } from "./signal-tag";

type LeadScoreCardProps = {
  item: IntelligenceInboxLead;
};

export function LeadScoreCard({ item }: LeadScoreCardProps) {
  const topSignals = item.intelligence.signals.slice(0, 3);

  return (
    <Card.Root
      asChild
      variant="outline"
      borderRadius="card"
      data-testid="intelligence-inbox-card"
      _hover={{ borderColor: "brand.focusRing", bg: "bg.subtle" }}
    >
      <NextLink href={buildLeadDetailHref(item.id, "intelligence")}>
        <Card.Body py="4" px="4">
          <Stack gap="3">
            <HStack justify="space-between" align="start" gap="3">
              <HStack align="baseline" gap="3">
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  lineHeight="1"
                  data-testid="intelligence-inbox-score"
                >
                  {item.score}
                </Text>
                <Stack gap="1">
                  <Heading as="h3" size="sm">
                    {item.companyName}
                  </Heading>
                  <Text fontSize="xs" color="fg.muted">
                    {item.source}
                  </Text>
                </Stack>
              </HStack>
              <QualificationBadge qualification={item.qualification} size="sm" />
            </HStack>

            {topSignals.length > 0 ? (
              <HStack gap="2" flexWrap="wrap">
                {topSignals.map((signal) => (
                  <SignalTag key={signal} signal={signal} />
                ))}
              </HStack>
            ) : null}

            {item.intelligence.pitch ? (
              <PitchPreview pitch={item.intelligence.pitch} />
            ) : item.intelligence.diagnostic ? (
              <PitchPreview pitch={item.intelligence.diagnostic} />
            ) : null}
          </Stack>
        </Card.Body>
      </NextLink>
    </Card.Root>
  );
}
