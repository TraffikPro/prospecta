import NextLink from "next/link";
import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";
import { ListPagination } from "@/components/ui/list-pagination";
import { LeadInventoryToolbar } from "@/features/leads/components/lead-inventory-toolbar";
import { LeadTable } from "@/features/leads/components/lead-table";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { resolveQualification } from "@/features/leads/intelligence";
import {
  inventoryHref,
  leadInventoryHasActiveFilters,
  parseLeadInventoryFilters,
} from "@/features/leads/lead-inventory";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import type { SessionUser } from "@/server/auth/types";
import { getLeads } from "@/server/services/lead.service";
import { getAdminUsers } from "@/server/services/user.service";

type LeadsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    stage?: string | string[];
    owner?: string | string[];
    page?: string | string[];
  }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const sessionUser = await getSessionUser();
  let user: SessionUser;
  try {
    user = requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const params = await searchParams;
  const filters = parseLeadInventoryFilters(params);
  const showOwner = user.role === "ADMIN";
  const hasFilters = leadInventoryHasActiveFilters(filters, {
    ownerFilterEnabled: showOwner,
  });

  const [inventory, ownerOptions] = await Promise.all([
    getLeads(user, filters),
    showOwner
      ? getAdminUsers().then((users) =>
          users.map((u) => ({ id: u.id, name: u.name })),
        )
      : Promise.resolve([]),
  ]);

  const { leads, total, page, pageSize, totalPages } = inventory;

  // Stale ?page= beyond last page → canonical URL (preserves filters).
  if (filters.page !== page && total > 0) {
    redirect(
      inventoryHref({
        q: filters.q,
        stage: filters.stage,
        ownerId: filters.ownerId,
        page,
      }),
    );
  }

  return (
    <PageFrame width="list" gap="5">
      <ContextualNav items={[{ label: "Leads" }]} />
      <PageHeading
        title="Leads"
        meta="Inventário comercial — busque, filtre e abra o registro."
        actions={
          <Button asChild size="md" minH="touch">
            <NextLink href="/app/leads/new">+ Novo Lead</NextLink>
          </Button>
        }
      />

      <LeadInventoryToolbar
        filters={{ ...filters, page }}
        showOwnerFilter={showOwner}
        ownerOptions={ownerOptions}
        resultCount={total}
        pageSize={pageSize}
        page={page}
        totalPages={totalPages}
      />

      {total === 0 ? (
        hasFilters ? (
          <AppEmptyState
            data-testid="leads-no-results"
            title="Nenhum lead encontrado com esses filtros."
            description="Ajuste a busca ou limpe os filtros para ver o inventário."
            action={
              <Button asChild size="md" minH="touch" variant="outline" colorPalette="gray">
                <NextLink href="/app/leads">Limpar filtros</NextLink>
              </Button>
            }
          />
        ) : (
          <AppEmptyState
            data-testid="leads-empty"
            title="Nenhum lead cadastrado."
            description="Cadastre o primeiro lead para montar o inventário."
            action={
              <Button asChild size="md" minH="touch">
                <NextLink href="/app/leads/new">+ Novo Lead</NextLink>
              </Button>
            }
          />
        )
      ) : (
        <>
          <LeadTable
            showOwner={showOwner}
            leads={leads.map((lead) => {
              const intelligence = parseLeadIntelligence(lead.intelligence);
              const score =
                typeof intelligence?.score === "number"
                  ? intelligence.score
                  : null;
              const qualification = intelligence
                ? (resolveQualification(intelligence) ?? null)
                : null;
              return {
                id: lead.id,
                companyName: lead.companyName,
                contactName: lead.contactName,
                stage: lead.stage,
                source: lead.source,
                ownerName: lead.owner.name,
                score,
                qualification,
                createdAt: lead.createdAt.toISOString(),
              };
            })}
          />
          <ListPagination
            label="Paginação do inventário de leads"
            state={{ page, pageSize, totalItems: total, totalPages }}
            hrefForPage={(nextPage) =>
              inventoryHref({
                q: filters.q,
                stage: filters.stage,
                ownerId: filters.ownerId,
                page: nextPage,
              })
            }
          />
        </>
      )}
    </PageFrame>
  );
}
