import Link from "next/link";
import type { LeadSource, LeadStage } from "@prisma/client";
import { Card, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import { LeadSourceBadge } from "@/features/leads/components/lead-source-badge";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";

export type LeadStageCardData = {
  id: string;
  companyName: string;
  source: LeadSource;
  stage: LeadStage;
  intelligence: unknown;
  nextFollowUpAt: Date | null;
  lostReason: string | null;
};

type LeadStageCardProps = {
  lead: LeadStageCardData;
  followUpLabel: string | null;
};

export function LeadStageCard({ lead, followUpLabel }: LeadStageCardProps) {
  const intelligence = parseLeadIntelligence(lead.intelligence);
  const score = intelligence?.score;
  const href = `/app/leads/${lead.id}`;

  return (
    <Card.Root variant="outline" borderRadius="card" h="full">
      <Card.Body>
        <Stack gap="3" h="full" justify="space-between">
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="semibold">
              <ChakraLink asChild color="fg" _hover={{ color: "brand.fg" }}>
                <Link href={href}>{lead.companyName}</Link>
              </ChakraLink>
            </Text>
            <LeadSourceBadge source={lead.source} />
            {typeof score === "number" ? (
              <Text fontSize="sm" color="fg.muted">
                Score {score}
              </Text>
            ) : null}
            {followUpLabel ? (
              <Text fontSize="sm" color="fg.muted">
                Follow-up {followUpLabel}
              </Text>
            ) : null}
            {lead.stage === "LOST" && lead.lostReason ? (
              <Text fontSize="sm" color="fg.muted">
                Motivo: {lead.lostReason}
              </Text>
            ) : null}
          </Stack>
          <Button
            asChild
            size="md"
            minH="11"
            variant="outline"
            colorPalette="gray"
            alignSelf="stretch"
          >
            <Link href={href}>Abrir lead</Link>
          </Button>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
