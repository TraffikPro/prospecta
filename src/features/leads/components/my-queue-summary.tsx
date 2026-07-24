import { Card, Link as ChakraLink, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import type { MyQueueFilter, MyQueueSummary } from "@/features/leads/my-queue";

type MyQueueSummaryCardsProps = {
  summary: MyQueueSummary;
  activeFilter: MyQueueFilter;
};

function SummaryCard({
  label,
  count,
  testId,
  href,
  isActive,
}: {
  label: string;
  count: number;
  testId: string;
  href: string;
  isActive: boolean;
}) {
  return (
    <ChakraLink asChild _hover={{ textDecoration: "none" }}>
      <NextLink href={href}>
        <Card.Root
          variant="outline"
          borderRadius="card"
          borderColor={isActive ? "brand.solid" : undefined}
          bg={isActive ? "brand.subtle" : undefined}
        >
          <Card.Body>
            <Stack gap="1">
              <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                {label}
              </Text>
              <Text fontSize="2xl" fontWeight="semibold" data-testid={testId}>
                {count}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {count === 1 ? "lead" : "leads"}
              </Text>
            </Stack>
          </Card.Body>
        </Card.Root>
      </NextLink>
    </ChakraLink>
  );
}

export function MyQueueSummaryCards({
  summary,
  activeFilter,
}: MyQueueSummaryCardsProps) {
  return (
    <SimpleGrid
      columns={{ base: 1, sm: 3 }}
      gap="3"
      data-testid="my-queue-summary"
    >
      <SummaryCard
        label="Sem contato"
        count={summary.noContact}
        testId="my-queue-count-no-contact"
        href="/app/my-leads?filter=new"
        isActive={activeFilter === "new"}
      />
      <SummaryCard
        label="Follow-up hoje"
        count={summary.dueToday}
        testId="my-queue-count-due-today"
        href="/app/my-leads?filter=follow-up"
        isActive={activeFilter === "follow-up"}
      />
      <SummaryCard
        label="Atrasados"
        count={summary.overdue}
        testId="my-queue-count-overdue"
        href="/app/my-leads?filter=overdue"
        isActive={activeFilter === "overdue"}
      />
    </SimpleGrid>
  );
}
