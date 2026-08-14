import { SimpleGrid, Stack, Text } from "@chakra-ui/react";

import type { DashboardSourceRow } from "@/features/dashboard/dashboard.view";

type SourceBreakdownProps = {
  rows: DashboardSourceRow[];
};

export function SourceBreakdown({ rows }: SourceBreakdownProps) {
  return (
    <SimpleGrid
      columns={{ base: 2, md: 4 }}
      gap="3"
      data-testid="dashboard-sources"
    >
      {rows.map((row) => (
        <Stack key={row.id} gap="1" minW="0" data-testid={`dashboard-source-${row.id}`}>
          <Text fontSize="xs" fontWeight="medium" color="fg.muted">
            {row.label}
          </Text>
          <Text fontSize="lg" fontWeight="semibold">
            {row.count}
          </Text>
        </Stack>
      ))}
    </SimpleGrid>
  );
}
