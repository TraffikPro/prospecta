import type { ReactNode } from "react";

import { HStack, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import type {
  IntelligenceInboxFilters,
  IntelligenceQualificationFilter,
  IntelligenceSourceFilter,
} from "@/features/leads/intelligence/inbox";
import {
  leadSourceLabels,
  qualificationLabels,
} from "@/features/leads/lead.labels";

type IntelligenceFiltersProps = {
  filters: IntelligenceInboxFilters;
};

function hrefFor(next: Partial<IntelligenceInboxFilters>, current: IntelligenceInboxFilters) {
  const params = new URLSearchParams();
  const qualification = next.qualification ?? current.qualification;
  const source = next.source ?? current.source;
  if (qualification !== "ALL") {
    params.set("qualification", qualification);
  }
  if (source !== "ALL") {
    params.set("source", source);
  }
  const query = params.toString();
  return query ? `/app/intelligence?${query}` : "/app/intelligence";
}

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
        style={{
          fontSize: "0.875rem",
          fontWeight: active ? 600 : 400,
          textDecoration: active ? "underline" : "none",
          textUnderlineOffset: "3px",
          color: active ? "inherit" : undefined,
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

const QUALIFICATION_OPTIONS: {
  value: IntelligenceQualificationFilter;
  label: string;
}[] = [
  { value: "ALL", label: "Todos" },
  { value: "HIGH", label: qualificationLabels.HIGH },
  { value: "MEDIUM", label: qualificationLabels.MEDIUM },
];

const SOURCE_OPTIONS: { value: IntelligenceSourceFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "GOOGLE_PLACES", label: leadSourceLabels.GOOGLE_PLACES },
  { value: "MANUAL", label: leadSourceLabels.MANUAL },
];

export function IntelligenceFilters({ filters }: IntelligenceFiltersProps) {
  return (
    <Stack gap="3" data-testid="intelligence-inbox-filters">
      <Stack gap="1">
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
          Score
        </Text>
        <HStack gap="3" flexWrap="wrap">
          {QUALIFICATION_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              href={hrefFor({ qualification: option.value }, filters)}
              active={filters.qualification === option.value}
            >
              {option.label}
            </FilterChip>
          ))}
        </HStack>
      </Stack>
      <Stack gap="1">
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
          Origem
        </Text>
        <HStack gap="3" flexWrap="wrap">
          {SOURCE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              href={hrefFor({ source: option.value }, filters)}
              active={filters.source === option.value}
            >
              {option.label}
            </FilterChip>
          ))}
        </HStack>
      </Stack>
    </Stack>
  );
}
