import type { LeadSource } from "@prisma/client";
import { Stack, Text } from "@chakra-ui/react";

import { SectionHeading } from "@/components/layout/page-heading";
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
      gap="3"
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      px="4"
      py="4"
      aria-labelledby="intelligence-heading"
      data-testid="lead-intelligence-fallback"
      data-source={source}
    >
      <Stack gap="1">
        <SectionHeading id="intelligence-heading">
          Qualificação do lead
        </SectionHeading>
        <Text textStyle="meta">
          Evidência persistida para apoiar a abordagem — não substitui o
          histórico de contato.
        </Text>
      </Stack>
      <AppEmptyState
        variant="compact"
        title="Qualificação não disponível"
        description={description}
      />
    </Stack>
  );
}
