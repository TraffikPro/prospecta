import { Box, HStack } from "@chakra-ui/react";
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
    <Box
      as="nav"
      aria-label="Filtros da fila"
      data-testid="my-queue-filters"
      overflowX="auto"
      overflowY="hidden"
      mx={{ base: "-4", md: "0" }}
      px={{ base: "4", md: "0" }}
      css={{
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      <HStack gap="2" flexWrap="nowrap" minW="min-content" pb="1">
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
              size="md"
              minH="11"
              flexShrink={0}
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
    </Box>
  );
}
