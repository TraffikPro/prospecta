"use client";

import type { ReactNode } from "react";

import {
  Box,
  Collapsible,
  DataList,
  Stack,
  Text,
  useCollapsibleContext,
} from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

type LeadOriginDetailsProps = {
  contactName: string | null;
  website: string | null;
  nextFollowUpLabel: string;
  notes: string | null;
};

function InfoValue({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <DataList.ItemValue
      fontWeight="medium"
      overflowWrap="anywhere"
      data-testid={testId}
    >
      {children}
    </DataList.ItemValue>
  );
}

function OriginTrigger() {
  const collapsible = useCollapsibleContext();

  return (
    <Collapsible.Trigger asChild>
      <Button
        variant="outline"
        colorPalette="gray"
        width="full"
        justifyContent="space-between"
        size="md"
        minH="11"
        aria-expanded={collapsible.open}
        aria-controls="lead-origin-details-content"
      >
        Detalhes da origem
        <Collapsible.Indicator />
      </Button>
    </Collapsible.Trigger>
  );
}

/**
 * Technical / secondary lead fields + notes — end of main column (not sticky).
 */
export function LeadOriginDetails({
  contactName,
  website,
  nextFollowUpLabel,
  notes,
}: LeadOriginDetailsProps) {
  return (
    <Collapsible.Root data-testid="lead-origin-details">
      <OriginTrigger />
      <Collapsible.Content id="lead-origin-details-content">
        <Box pt="4">
          <Stack gap="4">
            <DataList.Root
              orientation="vertical"
              size="sm"
              display="grid"
              gridTemplateColumns={{ base: "1fr", sm: "1fr 1fr" }}
              gap="4"
            >
              <DataList.Item>
                <DataList.ItemLabel>Contato</DataList.ItemLabel>
                <InfoValue>{contactName || "—"}</InfoValue>
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

            {notes ? (
              <Stack gap="2" aria-labelledby="notes-heading">
                <Text
                  as="h3"
                  id="notes-heading"
                  fontSize="sm"
                  fontWeight="semibold"
                >
                  Notas
                </Text>
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {notes}
                </Text>
              </Stack>
            ) : null}
          </Stack>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
