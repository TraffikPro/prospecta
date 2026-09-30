"use client";

import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { buildLeadDetailHref } from "@/components/navigation";
import type { IntelligenceInboxLead } from "@/features/leads/intelligence/inbox";
import { buildPriorityEvidence } from "@/features/leads/intelligence/priority-evidence";
import { leadSourceLabels, leadStageLabels, qualificationLabels } from "@/features/leads/lead.labels";

type LeadScoreCardProps = {
  item: IntelligenceInboxLead;
  showOwner?: boolean;
};

/**
 * Dense Prioridades row — score + evidence, not a marketing card.
 */
export function LeadScoreCard({
  item,
  showOwner = false,
}: LeadScoreCardProps) {
  const href = buildLeadDetailHref(item.id, "intelligence");
  const evidence = buildPriorityEvidence(item.intelligence);
  const hasEvidence =
    evidence.signalLabels.length > 0 ||
    Boolean(evidence.reasonLine) ||
    Boolean(evidence.placesLine);

  return (
    <Box
      as="article"
      data-testid="intelligence-inbox-card"
      data-lead-id={item.id}
      data-score={item.score}
      data-qualification={item.qualification}
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      bg="bg"
      _hover={{ bg: "bg.subtle" }}
    >
      <NextLink
        href={href}
        data-testid="intelligence-inbox-row-link"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <Stack
          direction={{ base: "column", sm: "row" }}
          align={{ base: "stretch", sm: "flex-start" }}
          gap={{ base: "2", sm: "4" }}
          px={{ base: "3", md: "4" }}
          py={{ base: "3", md: "3" }}
          minH="touch"
        >
          <Stack
            gap="0"
            align="flex-start"
            flexShrink={0}
            minW={{ sm: "4.5rem" }}
          >
            <Text
              fontSize="xl"
              fontWeight="bold"
              lineHeight="1"
              letterSpacing="tight"
              data-testid="intelligence-inbox-score"
              aria-label={`Score ${item.score} de 100`}
            >
              {item.score}
            </Text>
            <Text fontSize="xs" color="fg.muted" whiteSpace="nowrap">
              {qualificationLabels[item.qualification]}
            </Text>
          </Stack>

          <Stack gap="1" flex="1" minW="0">
            <HStack gap="2" flexWrap="wrap" align="baseline">
              <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                {item.companyName}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {leadStageLabels[item.stage]}
              </Text>
              {showOwner ? (
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {item.ownerName}
                </Text>
              ) : null}
            </HStack>

            {hasEvidence ? (
              <Stack gap="1">
                {evidence.signalLabels.length > 0 ? (
                  <Text
                    fontSize="sm"
                    color="fg"
                    data-testid="intelligence-inbox-signals"
                  >
                    {evidence.signalLabels.join(" · ")}
                  </Text>
                ) : null}
                {evidence.reasonLine ? (
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    lineClamp={2}
                    data-testid="intelligence-inbox-reason"
                  >
                    {evidence.reasonLine}
                  </Text>
                ) : null}
                {evidence.placesLine ? (
                  <Text fontSize="xs" color="fg.muted">
                    {evidence.placesLine}
                  </Text>
                ) : null}
              </Stack>
            ) : (
              <Text fontSize="sm" color="fg.muted">
                Score disponível — critérios detalhados no lead.
              </Text>
            )}

            <Text fontSize="xs" color="fg.muted">
              {leadSourceLabels[item.source] ?? item.source}
            </Text>
          </Stack>
        </Stack>
      </NextLink>
    </Box>
  );
}
