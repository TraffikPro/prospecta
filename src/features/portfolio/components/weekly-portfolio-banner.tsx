import { HStack, Stack, Text } from "@chakra-ui/react";

import { FillWalletButton } from "@/features/portfolio/components/fill-wallet-button";
import type { PortfolioSummary } from "@/server/services/portfolio.service";
import type { WalletFillStatus } from "@/server/services/wallet-fill.service";

type WeeklyPortfolioBannerProps = {
  summary: PortfolioSummary;
  fillStatus?: WalletFillStatus;
};

function fillResultCopy(status: WalletFillStatus): string | null {
  const job = status.lastJob;
  if (!job || job.status !== "SUCCEEDED") {
    return null;
  }
  const assigned = job.assignedCount ?? 0;
  const requested = job.requestedSlots ?? 0;
  if (assigned === 0) {
    return "Nenhum novo lead HIGH elegível nesta execução.";
  }
  if (status.slotsRemaining <= 0 || (requested > 0 && assigned >= requested)) {
    const noun =
      assigned === 1
        ? "novo lead HIGH atribuído"
        : "novos leads HIGH atribuídos";
    return `Carteira completa · ${assigned} ${noun}.`;
  }
  const assignedNoun =
    assigned === 1 ? "lead atribuído" : "leads atribuídos";
  return `${assigned} ${assignedNoun} · faltam ${status.slotsRemaining} para a meta.`;
}

/** Compact weekly carteira context for the daily work queue (not a KPI dashboard). */
export function WeeklyPortfolioBanner({
  summary,
  fillStatus,
}: WeeklyPortfolioBannerProps) {
  if (!summary.eligibleOperator) {
    return null;
  }

  if (!summary.quotaConfigured) {
    return (
      <Stack
        gap="1"
        borderWidth="1px"
        borderColor="border"
        borderRadius="surface"
        bg="bg"
        px="3"
        py="2.5"
        data-testid="weekly-portfolio-banner"
        data-quota="missing"
      >
        <Text fontSize="sm" fontWeight="semibold">
          Carteira semanal
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {summary.weekLabel} · meta ainda não configurada (Equipe).
        </Text>
      </Stack>
    );
  }

  const resultCopy = fillStatus ? fillResultCopy(fillStatus) : null;
  const showFill =
    fillStatus &&
    (fillStatus.reason === "ready" || fillStatus.reason === "running");

  return (
    <Stack
      gap="2"
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      bg="bg"
      px="3"
      py="2.5"
      data-testid="weekly-portfolio-banner"
      data-quota="configured"
    >
      <HStack
        justify="space-between"
        align="flex-start"
        gap="3"
        flexWrap="wrap"
      >
        <Stack gap="1" minW="0">
          <Text fontSize="sm" fontWeight="semibold">
            Carteira semanal
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {summary.weekLabel} · prazo domingo 23:59 (SP)
          </Text>
          <HStack gap="3" flexWrap="wrap" fontSize="xs">
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
        </Stack>
        {showFill ? (
          <FillWalletButton
            disabled={fillStatus.reason !== "ready"}
            running={fillStatus.reason === "running"}
          />
        ) : null}
      </HStack>
      {fillStatus?.reason === "running" ? (
        <Text fontSize="xs" color="fg.muted" role="status">
          Completando carteira…
        </Text>
      ) : null}
      {resultCopy && fillStatus?.reason !== "running" ? (
        <Text fontSize="xs" color="fg.muted" role="status">
          {resultCopy}
        </Text>
      ) : null}
    </Stack>
  );
}
