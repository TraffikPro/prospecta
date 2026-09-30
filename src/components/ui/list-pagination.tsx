import NextLink from "next/link";
import { HStack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";
import type { PaginationState } from "@/lib/pagination";

type ListPaginationProps = {
  state: PaginationState;
  /** Build href for a 1-based page, preserving other query params. */
  hrefForPage: (page: number) => string;
  /** Accessible name for the nav landmark. */
  label?: string;
};

/**
 * Compact Anterior / Página N de M / Próxima — URL-driven, no client state.
 */
export function ListPagination({
  state,
  hrefForPage,
  label = "Paginação",
}: ListPaginationProps) {
  if (state.totalItems === 0 || state.totalPages <= 1) {
    return null;
  }

  const prevDisabled = state.page <= 1;
  const nextDisabled = state.page >= state.totalPages;

  return (
    <HStack
      as="nav"
      aria-label={label}
      gap="3"
      justify="space-between"
      flexWrap="wrap"
      data-testid="list-pagination"
      data-page={state.page}
      data-total-pages={state.totalPages}
    >
      {prevDisabled ? (
        <Button
          size="md"
          minH="touch"
          variant="outline"
          colorPalette="gray"
          disabled
          data-testid="list-pagination-prev"
        >
          Anterior
        </Button>
      ) : (
        <Button
          asChild
          size="md"
          minH="touch"
          variant="outline"
          colorPalette="gray"
          data-testid="list-pagination-prev"
        >
          <NextLink href={hrefForPage(state.page - 1)} prefetch={false}>
            Anterior
          </NextLink>
        </Button>
      )}

      <Text
        fontSize="sm"
        color="fg.muted"
        data-testid="list-pagination-status"
        aria-live="polite"
      >
        Página {state.page} de {state.totalPages}
      </Text>

      {nextDisabled ? (
        <Button
          size="md"
          minH="touch"
          variant="outline"
          colorPalette="gray"
          disabled
          data-testid="list-pagination-next"
        >
          Próxima
        </Button>
      ) : (
        <Button
          asChild
          size="md"
          minH="touch"
          variant="outline"
          colorPalette="gray"
          data-testid="list-pagination-next"
        >
          <NextLink href={hrefForPage(state.page + 1)} prefetch={false}>
            Próxima
          </NextLink>
        </Button>
      )}
    </HStack>
  );
}
