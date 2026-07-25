import type { LeadSource } from "@prisma/client";
import { Heading, Stack } from "@chakra-ui/react";

import { AppEmptyState } from "@/components/ui/app-empty-state";

type LeadIntelligenceFallbackProps = {
  source: LeadSource;
};

/**
 * Compact empty for missing intelligence — never looks like a load failure.
 */
export function LeadIntelligenceFallback({
  source,
}: LeadIntelligenceFallbackProps) {
  const description =
    source === "MANUAL"
      ? "Este lead não possui dados de qualificação automática. Lead cadastrado manualmente."
      : "Este lead não possui dados de qualificação automática.";

  return (
    <Stack
      as="section"
      gap="2"
      aria-labelledby="intelligence-heading"
      data-testid="lead-intelligence-fallback"
      data-source={source}
    >
      <Heading as="h2" id="intelligence-heading" size="sm">
        Inteligência do lead
      </Heading>
      <AppEmptyState
        variant="compact"
        title="Inteligência não disponível"
        description={description}
      />
    </Stack>
  );
}
