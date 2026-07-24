"use client";

import type { ReactNode } from "react";

import type { LeadSource, LeadStage } from "@prisma/client";
import { Card, DataList, Heading, Stack } from "@chakra-ui/react";

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

function InfoValue({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <DataList.ItemValue fontWeight="medium" data-testid={testId}>
      {children}
    </DataList.ItemValue>
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
        <DataList.Root
          orientation="vertical"
          size="sm"
          display="grid"
          gridTemplateColumns={{ base: "1fr", sm: "1fr 1fr" }}
          gap="4"
          data-testid="lead-info-list"
        >
          <DataList.Item>
            <DataList.ItemLabel>Contato</DataList.ItemLabel>
            <InfoValue>{contactName || "—"}</InfoValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Owner</DataList.ItemLabel>
            <InfoValue>
              {ownerName} ({ownerEmail})
            </InfoValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>E-mail</DataList.ItemLabel>
            <InfoValue>{email || "—"}</InfoValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Telefone</DataList.ItemLabel>
            <InfoValue>{phone || "—"}</InfoValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Website</DataList.ItemLabel>
            <InfoValue>{website || "—"}</InfoValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Próximo contato</DataList.ItemLabel>
            <InfoValue testId="lead-next-follow-up">
              {nextFollowUpLabel}
            </InfoValue>
          </DataList.Item>
        </DataList.Root>
      </Card.Body>
    </Card.Root>
  );
}
