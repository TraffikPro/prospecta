import { SimpleGrid, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import {
  listAvailableNiches,
  PORTFOLIO_CATALOG,
} from "@/features/portfolio/portfolio.catalog";
import { PORTFOLIO_DISCLAIMER } from "@/features/portfolio/portfolio.labels";
import {
  filterPortfolioCatalog,
  parsePortfolioNicheFilter,
} from "@/features/portfolio/portfolio.filter";
import { PortfolioCard } from "@/features/portfolio/components/portfolio-card";
import { PortfolioFilters } from "@/features/portfolio/components/portfolio-filters";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";

type PageProps = {
  searchParams: Promise<{
    niche?: string | string[];
  }>;
};

export default async function PortfolioPage({ searchParams }: PageProps) {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const params = await searchParams;
  const nicheFilter = parsePortfolioNicheFilter(params.niche);
  const availableNiches = listAvailableNiches();
  const models = filterPortfolioCatalog(PORTFOLIO_CATALOG, nicheFilter);

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Portfólio" }]} />
      <PageHeading
        title="Portfólio comercial"
        meta="Escolha um modelo demonstrativo do nicho, copie o link e apresente na conversa."
      />

      <Text fontSize="sm" color="fg.muted" data-testid="portfolio-disclaimer">
        {PORTFOLIO_DISCLAIMER}
      </Text>

      <PortfolioFilters
        active={nicheFilter}
        availableNiches={availableNiches}
      />

      {models.length === 0 ? (
        <Text
          fontSize="sm"
          color="fg.muted"
          data-testid="portfolio-empty"
        >
          Nenhum modelo demonstrativo disponível para este filtro. Ajuste o
          nicho ou peça a publicação de novos sites-conceito.
        </Text>
      ) : (
        <SimpleGrid
          columns={{ base: 1, md: 2, xl: 3 }}
          gap="4"
          data-testid="portfolio-grid"
        >
          {models.map((model) => (
            <PortfolioCard key={model.id} model={model} />
          ))}
        </SimpleGrid>
      )}
    </PageFrame>
  );
}
