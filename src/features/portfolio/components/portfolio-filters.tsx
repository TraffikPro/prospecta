import type { ReactNode } from "react";

import { HStack, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { portfolioNicheLabels } from "../portfolio.labels";
import { portfolioFilterHref } from "../portfolio.filter";
import type { PortfolioNiche, PortfolioNicheFilter } from "../portfolio.schema";

type PortfolioFiltersProps = {
  active: PortfolioNicheFilter;
  availableNiches: PortfolioNiche[];
};

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <ChakraLink asChild>
      <NextLink
        href={href}
        data-active={active ? "true" : undefined}
        data-testid={`portfolio-filter-${href.includes("niche=") ? href.split("niche=")[1] : "ALL"}`}
        style={{
          fontSize: "0.875rem",
          fontWeight: active ? 600 : 400,
          textDecoration: active ? "underline" : "none",
          textUnderlineOffset: "3px",
          opacity: active ? 1 : 0.75,
          minHeight: "44px",
          display: "inline-flex",
          alignItems: "center",
          paddingInline: "0.25rem",
        }}
      >
        {children}
      </NextLink>
    </ChakraLink>
  );
}

export function PortfolioFilters({
  active,
  availableNiches,
}: PortfolioFiltersProps) {
  return (
    <Stack gap="1" data-testid="portfolio-filters">
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
        Nicho
      </Text>
      <HStack
        gap="3"
        flexWrap="nowrap"
        overflowX="auto"
        css={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <FilterChip href={portfolioFilterHref("ALL")} active={active === "ALL"}>
          Todos
        </FilterChip>
        {availableNiches.map((niche) => (
          <FilterChip
            key={niche}
            href={portfolioFilterHref(niche)}
            active={active === niche}
          >
            {portfolioNicheLabels[niche]}
          </FilterChip>
        ))}
      </HStack>
    </Stack>
  );
}
