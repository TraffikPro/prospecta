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
    return "Nenhum novo lead HIGH elegível foi encontrado nesta execução.";
  }
  if (status.slotsRemaining <= 0 || (requested > 0 && assigned >= requested)) {
    const noun =
      assigned === 1
        ? "novo lead HIGH foi atribuído"
        : "novos leads HIGH foram atribuídos";
    return `Carteira completada. ${assigned} ${noun}.`;
  }
  const assignedNoun =
    assigned === 1 ? "lead foi atribuído" : "leads foram atribuídos";
  return `${assigned} ${assignedNoun}. Ainda faltam ${status.slotsRemaining} para completar sua meta.`;
}

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
        gap="2"
        borderWidth="1px"
        borderColor="border"
        borderRadius="card"
        bg="bg"
        p="4"
        data-testid="weekly-portfolio-banner"
        data-quota="missing"
      >
        <Text fontWeight="semibold">Carteira semanal</Text>
        <Text fontSize="sm" color="fg.muted">
          {summary.weekLabel} · prazo domingo 23:59 (São Paulo)
        </Text>
        <Text fontSize="sm">
          Meta semanal ainda não configurada. Peça a um administrador para
          definir sua meta em Equipe antes de completar a carteira.
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
      borderRadius="card"
      bg="bg"
      p="4"
      data-testid="weekly-portfolio-banner"
      data-quota="configured"
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
      {showFill ? (
        <FillWalletButton
          disabled={fillStatus.reason !== "ready"}
          running={fillStatus.reason === "running"}
        />
      ) : null}
      {fillStatus?.reason === "running" ? (
        <Text fontSize="sm" color="fg.muted" role="status">
          Sua carteira já está sendo completada.
        </Text>
      ) : null}
      {resultCopy && fillStatus?.reason !== "running" ? (
        <Text fontSize="sm" color="fg.muted" role="status">
          {resultCopy}
        </Text>
      ) : null}
      <Text fontSize="xs" color="fg.muted">
        Tratado = WhatsApp ou e-mail com resultado registrado após a atribuição.
        Completar carteira atribui somente HIGH elegíveis retornados por esta
        execução, até a meta.
      </Text>
    </Stack>
  );
}
