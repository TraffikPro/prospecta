"use client";

import Link from "next/link";
import type { LeadSource, LeadStage } from "@prisma/client";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";

import { buildLeadDetailHref } from "@/components/navigation";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { leadSourceLabels } from "@/features/leads/lead.labels";

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

/**
 * Compact Pipeline lead row — identity + light commercial context.
 * Stage transitions remain on Lead Detail (not on this board).
 */
export function LeadStageCard({ lead, followUpLabel }: LeadStageCardProps) {
  const intelligence = parseLeadIntelligence(lead.intelligence);
  const score =
    typeof intelligence?.score === "number" ? intelligence.score : null;
  const href = buildLeadDetailHref(lead.id, "pipeline");

  return (
    <Box
      as="article"
      data-testid="pipeline-lead-row"
      data-lead-id={lead.id}
      data-stage={lead.stage}
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      bg="bg"
      _hover={{ bg: "bg.subtle" }}
    >
      <Link
        href={href}
        data-testid="pipeline-lead-link"
        aria-label={lead.companyName}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <Stack
          gap="1"
          px="3"
          py="2.5"
          minH="touch"
          justify="center"
        >
          <HStack gap="2" flexWrap="wrap" align="baseline">
            <Text fontSize="sm" fontWeight="semibold" lineClamp={1}>
              {lead.companyName}
            </Text>
            {score != null ? (
              <Text fontSize="xs" color="fg.muted" whiteSpace="nowrap">
                Score {score}
              </Text>
            ) : null}
          </HStack>
          <HStack gap="3" flexWrap="wrap" fontSize="xs" color="fg.muted">
            <Text as="span">
              {leadSourceLabels[lead.source] ?? lead.source}
            </Text>
            {followUpLabel ? (
              <Text as="span">Follow-up {followUpLabel}</Text>
            ) : null}
            {lead.stage === "LOST" && lead.lostReason ? (
              <Text as="span" lineClamp={1}>
                Motivo: {lead.lostReason}
              </Text>
            ) : null}
          </HStack>
        </Stack>
      </Link>
    </Box>
  );
}
