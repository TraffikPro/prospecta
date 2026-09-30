import { Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";
import { ListPagination } from "@/components/ui/list-pagination";
import {
  IntelligenceFilters,
  LeadScoreCard,
} from "@/features/leads/components/intelligence";
import {
  intelligenceInboxHref,
  parseInboxFilters,
} from "@/features/leads/intelligence/inbox";
import { qualificationLabels } from "@/features/leads/lead.labels";
import { parsePageParam } from "@/lib/pagination";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getIntelligenceInbox } from "@/server/services/lead.service";

type PageProps = {
  searchParams: Promise<{
    qualification?: string | string[];
    source?: string | string[];
    page?: string | string[];
  }>;
};

export default async function IntelligenceInboxPage({ searchParams }: PageProps) {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const user = sessionUser!;
  const params = await searchParams;
  const filters = parseInboxFilters(params);
  const requestedPage = parsePageParam(params.page);
  const { items, counts, totalMatching, page, pageSize, totalPages } =
    await getIntelligenceInbox(filters, user, { page: requestedPage });
  const filterActive =
    filters.qualification !== "ALL" || filters.source !== "ALL";
  const showOwner = user.role === "ADMIN";
  const totalScored = counts.HIGH + counts.MEDIUM + counts.LOW;

  if (requestedPage !== page && totalMatching > 0) {
    redirect(
      intelligenceInboxHref({
        qualification: filters.qualification,
        source: filters.source,
        page,
      }),
    );
  }

  return (
    <PageFrame width="list" gap="5">
      <ContextualNav items={[{ label: "Prioridades" }]} />
      <PageHeading
        title="Prioridades"
        meta="Leads com score e sinais — onde há maior potencial e por quê. Ação do dia continua em Minha fila."
      />

      <Text fontSize="sm" color="fg.muted" data-testid="intelligence-inbox-counts">
        {totalScored === 0
          ? "Nenhum lead com score parseável."
          : `${counts.HIGH} ${qualificationLabels.HIGH} · ${counts.MEDIUM} ${qualificationLabels.MEDIUM} · ${counts.LOW} ${qualificationLabels.LOW}${filterActive ? " (filtro ativo)" : ""}`}
        {totalMatching > 0
          ? ` · ${totalMatching} no filtro · página ${page} de ${totalPages}`
          : ""}
      </Text>

      <IntelligenceFilters filters={filters} />

      {totalMatching === 0 ? (
        <AppEmptyState
          data-testid="intelligence-inbox-empty"
          title={
            filterActive
              ? "Nenhum lead com score neste filtro."
              : "Nenhum lead com score disponível."
          }
          description={
            filterActive
              ? "Ajuste qualificação/origem ou limpe os filtros."
              : "Prioridades lista apenas leads com inteligência parseável (score + qualificação). Cadastre ou importe leads com score, ou use Minha fila para o trabalho do dia."
          }
          action={
            filterActive ? (
              <Button
                asChild
                size="md"
                minH="touch"
                variant="outline"
                colorPalette="gray"
              >
                <Link href="/app/intelligence">Limpar filtros</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="md"
                minH="touch"
                variant="outline"
                colorPalette="gray"
              >
                <Link href="/app/my-leads">Ir para Minha fila</Link>
              </Button>
            )
          }
        />
      ) : (
        <Stack gap="3">
          <Stack gap="2" data-testid="intelligence-inbox-list">
            {items.map((item) => (
              <LeadScoreCard
                key={item.id}
                item={item}
                showOwner={showOwner}
              />
            ))}
          </Stack>
          <ListPagination
            label="Paginação de prioridades"
            state={{
              page,
              pageSize,
              totalItems: totalMatching,
              totalPages,
            }}
            hrefForPage={(nextPage) =>
              intelligenceInboxHref({
                qualification: filters.qualification,
                source: filters.source,
                page: nextPage,
              })
            }
          />
        </Stack>
      )}
    </PageFrame>
  );
}
