import { HStack, NativeSelect, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LEAD_INVENTORY_STAGE_OPTIONS,
  inventoryHref,
  type LeadInventoryFilters,
} from "@/features/leads/lead-inventory";
import { leadStageLabels } from "@/features/leads/lead.labels";

export type LeadInventoryOwnerOption = {
  id: string;
  name: string;
};

type LeadInventoryToolbarProps = {
  filters: LeadInventoryFilters;
  ownerOptions?: LeadInventoryOwnerOption[];
  showOwnerFilter: boolean;
  /** Total matching results (not page size). */
  resultCount: number;
  pageSize?: number;
  page?: number;
  totalPages?: number;
};

export function LeadInventoryToolbar({
  filters,
  ownerOptions = [],
  showOwnerFilter,
  resultCount,
  pageSize,
  page,
  totalPages,
}: LeadInventoryToolbarProps) {
  const clearHref = inventoryHref({});
  const countLabel =
    resultCount === 1 ? "1 lead" : `${resultCount} leads`;
  const pageLabel =
    pageSize && page && totalPages && resultCount > 0
      ? ` · página ${page} de ${totalPages} (${Math.min(pageSize, resultCount)} nesta página)`
      : "";

  return (
    <Stack gap="3" data-testid="leads-inventory-toolbar">
      <Text fontSize="sm" color="fg.muted" data-testid="leads-inventory-count">
        {countLabel}
        {pageLabel}
      </Text>

      <form method="get" action="/app/leads" data-testid="leads-inventory-filters">
        {/* Filter submit resets to page 1 by omitting page. */}
        <Stack
          direction={{ base: "column", md: "row" }}
          gap="2"
          align={{ base: "stretch", md: "flex-end" }}
          flexWrap="wrap"
        >
          <Stack gap="1" flex="1" minW={{ md: "220px" }}>
            <Text fontSize="xs" fontWeight="medium" as="span" id="leads-q-label">
              Buscar leads
            </Text>
            <Input
              id="leads-q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Empresa, contato, e-mail ou telefone"
              minH="touch"
              aria-labelledby="leads-q-label"
            />
          </Stack>

          <Stack gap="1" minW={{ base: "full", md: "160px" }}>
            <Text fontSize="xs" fontWeight="medium" as="span" id="leads-stage-label">
              Estágio
            </Text>
            <NativeSelect.Root size="md" minH="touch">
              <NativeSelect.Field
                id="leads-stage"
                name="stage"
                defaultValue={filters.stage}
                minH="touch"
                aria-labelledby="leads-stage-label"
              >
                {LEAD_INVENTORY_STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage === "ALL"
                      ? "Todos os estágios"
                      : leadStageLabels[stage]}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Stack>

          {showOwnerFilter ? (
            <Stack gap="1" minW={{ base: "full", md: "180px" }}>
              <Text
                fontSize="xs"
                fontWeight="medium"
                as="span"
                id="leads-owner-label"
              >
                Responsável
              </Text>
              <NativeSelect.Root size="md" minH="touch">
                <NativeSelect.Field
                  id="leads-owner"
                  name="owner"
                  defaultValue={filters.ownerId ?? ""}
                  minH="touch"
                  aria-labelledby="leads-owner-label"
                >
                  <option value="">Todos os responsáveis</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Stack>
          ) : null}

          <HStack gap="2" flexShrink={0} align="stretch">
            <Button type="submit" size="md" minH="touch">
              Filtrar
            </Button>
            <Button
              asChild
              size="md"
              minH="touch"
              variant="outline"
              colorPalette="gray"
            >
              <NextLink href={clearHref}>Limpar</NextLink>
            </Button>
          </HStack>
        </Stack>
      </form>
    </Stack>
  );
}
