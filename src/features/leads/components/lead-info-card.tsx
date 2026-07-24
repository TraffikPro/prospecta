"use client";

import type { ReactNode } from "react";

import type { LeadSource, LeadStage } from "@prisma/client";
import { Card, Grid, Heading, Stack, Text } from "@chakra-ui/react";

import { LeadSourceBadge } from "./lead-source-badge";
import { LeadStageBadge } from "./lead-stage-badge";

type LeadInfoCardProps = {
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  stage: LeadStage;
  source: LeadSource;
  ownerName: string;
  ownerEmail: string;
  nextFollowUpLabel: string;
};

function InfoItem({
  label,
  children,
  testId,
}: {
  label: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <Stack gap="1">
      <Text fontSize="xs" color="fg.muted" fontWeight="medium">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="medium" data-testid={testId}>
        {children}
      </Text>
    </Stack>
  );
}

export function LeadInfoCard({
  companyName,
  contactName,
  email,
  phone,
  website,
  stage,
  source,
  ownerName,
  ownerEmail,
  nextFollowUpLabel,
}: LeadInfoCardProps) {
  return (
    <Card.Root variant="outline" borderRadius="card">
      <Card.Header>
        <Stack
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "start", md: "center" }}
          gap="3"
        >
          <Heading as="h1" size="lg">
            {companyName}
          </Heading>
          <Stack direction="row" gap="2" flexWrap="wrap">
            <span data-testid="lead-stage" data-stage={stage}>
              <LeadStageBadge stage={stage} />
            </span>
            <span data-testid="lead-source" data-source={source}>
              <LeadSourceBadge source={source} />
            </span>
          </Stack>
        </Stack>
      </Card.Header>
      <Card.Body>
        <Grid
          templateColumns={{ base: "1fr", sm: "1fr 1fr" }}
          gap="4"
          fontSize="sm"
        >
          <InfoItem label="Contato">{contactName || "—"}</InfoItem>
          <InfoItem label="Owner">
            {ownerName} ({ownerEmail})
          </InfoItem>
          <InfoItem label="E-mail">{email || "—"}</InfoItem>
          <InfoItem label="Telefone">{phone || "—"}</InfoItem>
          <InfoItem label="Website">{website || "—"}</InfoItem>
          <InfoItem label="Próximo contato" testId="lead-next-follow-up">
            {nextFollowUpLabel}
          </InfoItem>
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}
