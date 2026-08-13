import { HStack, Stack, Text } from "@chakra-ui/react";

import type { PortfolioSummary } from "@/server/services/portfolio.service";

type WeeklyPortfolioBannerProps = {
  summary: PortfolioSummary;
};

export function WeeklyPortfolioBanner({ summary }: WeeklyPortfolioBannerProps) {
  if (!summary.eligibleOperator) {
    return null;
  }

  return (
    <Stack
      gap="2"
      borderWidth="1px"
      borderColor="border"
      borderRadius="card"
      bg="bg"
      p="4"
      data-testid="weekly-portfolio-banner"
    >
      <Text fontWeight="semibold">Carteira semanal</Text>
      <Text fontSize="sm" color="fg.muted">
        {summary.weekLabel} · prazo domingo 23:59 (São Paulo)
      </Text>
      <HStack gap="4" flexWrap="wrap" fontSize="sm">
        <Text>
          Meta <strong>{summary.target}</strong>
        </Text>
        <Text>
          Recebidos <strong>{summary.assigned}</strong>
        </Text>
        <Text>
          Tratados <strong>{summary.treated}</strong>
        </Text>
        <Text>
          Pendentes <strong>{summary.pending}</strong>
        </Text>
        <Text>
          Vagas <strong>{summary.slotsRemaining}</strong>
        </Text>
      </HStack>
      <Text fontSize="xs" color="fg.muted">
        Tratado = WhatsApp ou e-mail com resultado registrado após a atribuição.
        Completar com Places entra na Fase 3.
      </Text>
    </Stack>
  );
}
