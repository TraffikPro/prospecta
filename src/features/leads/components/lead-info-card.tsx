"use client";

import type { LeadSource, LeadStage } from "@prisma/client";
import { Alert, DataList, Heading, HStack, Stack, Text } from "@chakra-ui/react";

import {
  qualificationLabel,
  resolveQualification,
} from "@/features/leads/intelligence/qualification";
import type { LeadIntelligence } from "@/features/leads/intelligence/types";

import { LeadSourceBadge } from "./lead-source-badge";
import { LeadStageBadge } from "./lead-stage-badge";

type LeadInfoCardProps = {
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  stage: LeadStage;
  source: LeadSource;
  ownerName: string;
  ownerEmail: string;
  lostReason: string | null;
  intelligence: LeadIntelligence | null;
};

/**
 * Lead Detail identity header — company dominates; commercial metadata stays compact.
 * Contact channels live in the operational rail (not duplicated as a field grid).
 */
export function LeadInfoCard({
  companyName,
  contactName,
  email,
  phone,
  stage,
  source,
  ownerName,
  ownerEmail,
  lostReason,
  intelligence,
}: LeadInfoCardProps) {
  const qualification = intelligence
    ? resolveQualification(intelligence)
    : undefined;
  const score =
    typeof intelligence?.score === "number" ? intelligence.score : null;
  const isWon = stage === "WON";
  const isLost = stage === "LOST";

  return (
    <Stack gap="3" data-testid="lead-detail-header">
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "start", md: "center" }}
        gap="3"
      >
        <Stack gap="1" minW={0}>
          <Heading as="h1" textStyle="pageTitle">
            {companyName}
          </Heading>
          {contactName ? (
            <Text textStyle="meta" data-testid="lead-contact-name">
              {contactName}
            </Text>
          ) : null}
        </Stack>
        <HStack gap="2" flexWrap="wrap" flexShrink={0}>
          <span data-testid="lead-stage" data-stage={stage}>
            <LeadStageBadge stage={stage} />
          </span>
          <span data-testid="lead-source" data-source={source}>
            <LeadSourceBadge source={source} />
          </span>
        </HStack>
      </Stack>

      <DataList.Root
        orientation="horizontal"
        size="sm"
        display="flex"
        flexWrap="wrap"
        gap="4"
        columnGap="6"
        data-testid="lead-info-list"
      >
        {score != null ? (
          <DataList.Item>
            <DataList.ItemLabel>Score</DataList.ItemLabel>
            <DataList.ItemValue fontWeight="medium" data-testid="lead-header-score">
              {score}
              {qualification ? ` · ${qualificationLabel(qualification)}` : ""}
            </DataList.ItemValue>
          </DataList.Item>
        ) : null}
        <DataList.Item>
          <DataList.ItemLabel>Responsável</DataList.ItemLabel>
          <DataList.ItemValue fontWeight="medium" overflowWrap="anywhere">
            {ownerName}
            <Text as="span" color="fg.muted" fontWeight="normal">
              {" "}
              ({ownerEmail})
            </Text>
          </DataList.ItemValue>
        </DataList.Item>
        {email ? (
          <DataList.Item>
            <DataList.ItemLabel>E-mail</DataList.ItemLabel>
            <DataList.ItemValue fontWeight="medium" overflowWrap="anywhere">
              {email}
            </DataList.ItemValue>
          </DataList.Item>
        ) : null}
        {phone ? (
          <DataList.Item>
            <DataList.ItemLabel>Telefone</DataList.ItemLabel>
            <DataList.ItemValue fontWeight="medium" overflowWrap="anywhere">
              {phone}
            </DataList.ItemValue>
          </DataList.Item>
        ) : null}
      </DataList.Root>

      {isLost ? (
        <Alert.Root
          status="error"
          variant="subtle"
          size="sm"
          data-testid="lead-lost-reason"
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Lead perdido</Alert.Title>
            <Alert.Description>
              {lostReason?.trim()
                ? lostReason
                : "Motivo da perda não informado."}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      ) : null}

      {isWon ? (
        <Alert.Root
          status="success"
          variant="subtle"
          size="sm"
          data-testid="lead-won-state"
        >
          <Alert.Indicator />
          <Alert.Title>Lead ganho</Alert.Title>
          <Alert.Description>
            Etapa terminal — histórico e contexto permanecem disponíveis para
            consulta.
          </Alert.Description>
        </Alert.Root>
      ) : null}
    </Stack>
  );
}
