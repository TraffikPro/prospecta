import { HStack } from "@chakra-ui/react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import {
  MY_QUEUE_FILTERS,
  type MyQueueFilter,
  type MyQueueSummary,
} from "@/features/leads/my-queue";

type MyQueueFiltersProps = {
  active: MyQueueFilter;
  summary: MyQueueSummary;
};

function countForFilter(
  filter: MyQueueFilter,
  summary: MyQueueSummary,
): number {
  switch (filter) {
    case "all":
      return summary.total;
    case "new":
      return summary.noContact;
    case "follow-up":
      return summary.dueToday;
    case "overdue":
      return summary.overdue;
    case "conversation":
      return summary.inConversation;
  }
}

export function MyQueueFilters({ active, summary }: MyQueueFiltersProps) {
  return (
    <HStack
      as="nav"
      gap="2"
      flexWrap="wrap"
      aria-label="Filtros da fila"
      data-testid="my-queue-filters"
    >
      {MY_QUEUE_FILTERS.map((filter) => {
        const count = countForFilter(filter.id, summary);
        const href =
          filter.id === "all"
            ? "/app/my-leads"
            : `/app/my-leads?filter=${filter.id}`;
        const isActive = active === filter.id;

        return (
          <Button
            key={filter.id}
            asChild
            size="sm"
            variant={isActive ? "solid" : "outline"}
            colorPalette={isActive ? "brand" : "gray"}
            data-testid={`my-queue-filter-${filter.id}`}
            data-active={isActive ? "true" : "false"}
          >
            <NextLink href={href}>
              {filter.label} ({count})
            </NextLink>
          </Button>
        );
      })}
    </HStack>
  );
}
