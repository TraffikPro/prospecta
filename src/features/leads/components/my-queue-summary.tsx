import { Card, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import type { MyQueueSummary } from "@/features/leads/my-queue";

type MyQueueSummaryCardsProps = {
  summary: MyQueueSummary;
};

function SummaryCard({
  label,
  count,
  testId,
}: {
  label: string;
  count: number;
  testId: string;
}) {
  return (
    <Card.Root variant="outline" borderRadius="card">
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
  );
}

export function MyQueueSummaryCards({ summary }: MyQueueSummaryCardsProps) {
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
      />
      <SummaryCard
        label="Follow-up hoje"
        count={summary.dueToday}
        testId="my-queue-count-due-today"
      />
      <SummaryCard
        label="Atrasados"
        count={summary.overdue}
        testId="my-queue-count-overdue"
      />
    </SimpleGrid>
  );
}
