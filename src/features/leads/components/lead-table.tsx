"use client";

import type { LeadSource, LeadStage } from "@prisma/client";
import { Link as ChakraLink, Table, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { LeadSourceBadge } from "./lead-source-badge";
import { LeadStageBadge } from "./lead-stage-badge";

export type LeadTableRow = {
  id: string;
  companyName: string;
  stage: LeadStage;
  source: LeadSource;
};

type LeadTableProps = {
  leads: LeadTableRow[];
};

export function LeadTable({ leads }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        Nenhum lead cadastrado
      </Text>
    );
  }

  return (
    <Table.Root size="sm" variant="outline" data-testid="leads-table">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Empresa</Table.ColumnHeader>
          <Table.ColumnHeader>Stage</Table.ColumnHeader>
          <Table.ColumnHeader>Origem</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {leads.map((lead) => (
          <Table.Row key={lead.id} _hover={{ bg: "bg.subtle" }}>
            <Table.Cell>
              <ChakraLink asChild fontWeight="medium">
                <NextLink href={`/app/leads/${lead.id}`}>
                  {lead.companyName}
                </NextLink>
              </ChakraLink>
            </Table.Cell>
            <Table.Cell>
              <LeadStageBadge stage={lead.stage} />
            </Table.Cell>
            <Table.Cell>
              <LeadSourceBadge source={lead.source} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
