"use client";

import type { LeadSource, LeadStage } from "@prisma/client";
import { Box, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { buildLeadDetailHref } from "@/components/navigation";
import { Table } from "@/components/ui/table";
import { qualificationLabels } from "@/features/leads/lead.labels";
import type { LeadQualification } from "@/features/leads/intelligence/types";

import { LeadSourceBadge } from "./lead-source-badge";
import { LeadStageBadge } from "./lead-stage-badge";

export type LeadTableRow = {
  id: string;
  companyName: string;
  contactName: string | null;
  stage: LeadStage;
  source: LeadSource;
  ownerName: string;
  score: number | null;
  qualification: LeadQualification | null;
  createdAt: string;
};

type LeadTableProps = {
  leads: LeadTableRow[];
  showOwner: boolean;
};

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function scoreText(row: LeadTableRow): string {
  if (typeof row.score === "number" && row.qualification) {
    return `${row.score} · ${qualificationLabels[row.qualification]}`;
  }
  if (typeof row.score === "number") return String(row.score);
  if (row.qualification) return qualificationLabels[row.qualification];
  return "—";
}

function MobileLeadRow({
  lead,
  showOwner,
}: {
  lead: LeadTableRow;
  showOwner: boolean;
}) {
  const href = buildLeadDetailHref(lead.id, "leads");
  return (
    <Box
      as="article"
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      bg="bg"
      px="3"
      py="3"
      data-testid="leads-mobile-row"
      data-lead-id={lead.id}
    >
      <Stack gap="1">
        <ChakraLink asChild fontWeight="semibold" fontSize="sm">
          <NextLink href={href}>{lead.companyName}</NextLink>
        </ChakraLink>
        <Stack direction="row" gap="2" flexWrap="wrap" align="center">
          <LeadStageBadge stage={lead.stage} />
          <Text fontSize="xs" color="fg.muted">
            {scoreText(lead)}
          </Text>
        </Stack>
        {showOwner ? (
          <Text fontSize="xs" color="fg.muted">
            {lead.ownerName}
          </Text>
        ) : null}
        {lead.contactName ? (
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {lead.contactName}
          </Text>
        ) : null}
      </Stack>
    </Box>
  );
}

export function LeadTable({ leads, showOwner }: LeadTableProps) {
  if (leads.length === 0) {
    return null;
  }

  return (
    <>
      <Stack gap="2" display={{ base: "flex", md: "none" }} data-testid="leads-mobile-list">
        {leads.map((lead) => (
          <MobileLeadRow key={lead.id} lead={lead} showOwner={showOwner} />
        ))}
      </Stack>

      <Box display={{ base: "none", md: "block" }} overflowX="auto">
        <Table.Root data-testid="leads-table">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Empresa</Table.ColumnHeader>
              <Table.ColumnHeader hideBelow="lg">Contato</Table.ColumnHeader>
              <Table.ColumnHeader>Estágio</Table.ColumnHeader>
              {showOwner ? (
                <Table.ColumnHeader>Responsável</Table.ColumnHeader>
              ) : null}
              <Table.ColumnHeader>Score</Table.ColumnHeader>
              <Table.ColumnHeader hideBelow="lg">Origem</Table.ColumnHeader>
              <Table.ColumnHeader hideBelow="lg">Criado</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {leads.map((lead) => {
              const href = buildLeadDetailHref(lead.id, "leads");
              return (
                <Table.Row key={lead.id} _hover={{ bg: "bg.subtle" }}>
                  <Table.Cell>
                    <ChakraLink asChild fontWeight="medium">
                      <NextLink href={href}>{lead.companyName}</NextLink>
                    </ChakraLink>
                  </Table.Cell>
                  <Table.Cell hideBelow="lg">
                    <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                      {lead.contactName ?? "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <LeadStageBadge stage={lead.stage} />
                  </Table.Cell>
                  {showOwner ? (
                    <Table.Cell>
                      <Text fontSize="sm" lineClamp={1}>
                        {lead.ownerName}
                      </Text>
                    </Table.Cell>
                  ) : null}
                  <Table.Cell>
                    <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
                      {scoreText(lead)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell hideBelow="lg">
                    <LeadSourceBadge source={lead.source} />
                  </Table.Cell>
                  <Table.Cell hideBelow="lg">
                    <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
                      {formatCreatedAt(lead.createdAt)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </>
  );
}
