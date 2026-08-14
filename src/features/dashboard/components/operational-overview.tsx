import Link from "next/link";
import { SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { SectionHeading } from "@/components/layout/page-heading";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";
import { KpiStatCard } from "@/features/dashboard/components/kpi-stat-card";
import { ProgressMetric } from "@/features/dashboard/components/progress-metric";
import { SourceBreakdown } from "@/features/dashboard/components/source-breakdown";
import type { DashboardView } from "@/features/dashboard/dashboard.view";

type OperationalOverviewProps = {
  view: DashboardView;
};

export function OperationalOverview({ view }: OperationalOverviewProps) {
  const compactEmpty = view.empty?.kind === "all_treated";

  return (
    <Stack gap="6" data-testid="operational-dashboard" data-dashboard-kind={view.kind}>
      <Text textStyle="meta">
        Semana atual · {view.weekLabel}
      </Text>

      {view.operatorsLine ? (
        <Text textStyle="meta" data-testid="dashboard-operators">
          {view.operatorsLine}
        </Text>
      ) : null}

      {view.empty && !compactEmpty ? (
        <AppEmptyState
          title={view.empty.title}
          description={view.empty.description}
          data-testid={`dashboard-empty-${view.empty.kind}`}
        />
      ) : null}

      <SimpleGrid
        columns={{ base: 1, sm: 2, lg: 4 }}
        gap="3"
        data-testid="dashboard-kpi-grid"
      >
        {view.cards.map((item) => (
          <KpiStatCard
            key={item.id}
            title={item.title}
            value={item.value}
            hint={item.hint}
            emphasized={item.emphasized}
            data-testid={`dashboard-kpi-${item.id}`}
          />
        ))}
      </SimpleGrid>

      <Stack
        gap="4"
        borderWidth="1px"
        borderColor="border"
        borderRadius="card"
        bg="bg"
        p="4"
      >
        <SectionHeading>Progresso da semana</SectionHeading>
        <Stack gap="4">
          {view.progress.map((item) => (
            <ProgressMetric
              key={item.id}
              label={item.label}
              formatted={item.formatted}
              rate={item.rate}
              data-testid={`dashboard-progress-${item.id}`}
            />
          ))}
        </Stack>
      </Stack>

      <Stack
        gap="4"
        borderWidth="1px"
        borderColor="border"
        borderRadius="card"
        bg="bg"
        p="4"
      >
        <SectionHeading>Origem da carteira</SectionHeading>
        <SourceBreakdown rows={view.sources} />
      </Stack>

      {view.weekClosedCount != null ? (
        <Text textStyle="meta" data-testid="dashboard-week-closed">
          Expiraram sem tratamento: {view.weekClosedCount}
        </Text>
      ) : null}

      {compactEmpty && view.empty ? (
        <AppEmptyState
          variant="compact"
          title={view.empty.title}
          description={view.empty.description}
          data-testid="dashboard-empty-all_treated"
        />
      ) : null}

      <Stack
        direction={{ base: "column", sm: "row" }}
        gap="3"
        align={{ base: "stretch", sm: "center" }}
      >
        <Button asChild size="md" minH="touch">
          <Link href={view.primaryCta.href}>{view.primaryCta.label}</Link>
        </Button>
        {view.secondaryCtas.map((cta) => (
          <Button key={cta.href} asChild size="md" minH="touch" variant="outline">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
