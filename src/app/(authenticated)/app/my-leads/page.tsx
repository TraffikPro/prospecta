import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { ListPagination } from "@/components/ui/list-pagination";
import { MyQueueFilters } from "@/features/leads/components/my-queue-filters";
import { MyQueueList } from "@/features/leads/components/my-queue-list";
import { WeeklyPortfolioBanner } from "@/features/portfolio/components/weekly-portfolio-banner";
import { myQueueHref, parseMyQueueFilter } from "@/features/leads/my-queue";
import { parsePageParam } from "@/lib/pagination";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getMyQueueForOwner } from "@/server/services/lead.service";
import { getPortfolioSummaryForUser } from "@/server/services/portfolio.service";
import { getWalletFillStatus } from "@/server/services/wallet-fill.service";

type MyLeadsPageProps = {
  searchParams: Promise<{
    filter?: string;
    page?: string;
  }>;
};

export default async function MyLeadsPage({ searchParams }: MyLeadsPageProps) {
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
  const filter = parseMyQueueFilter(params.filter);
  const requestedPage = parsePageParam(params.page);
  const portfolio = await getPortfolioSummaryForUser(user.id);
  const fillStatus = await getWalletFillStatus(user.id);
  const view = await getMyQueueForOwner(user.id, {
    filter,
    page: requestedPage,
  });

  if (
    filter !== "all" &&
    requestedPage !== view.page &&
    view.filteredTotal > 0
  ) {
    redirect(myQueueHref({ filter, page: view.page }));
  }

  return (
    <PageFrame width="list" gap="5">
      <ContextualNav items={[{ label: "Minha fila" }]} />
      <PageHeading
        title="Minha fila"
        meta="Próximos leads que precisam de ação — atrasados e follow-ups primeiro."
      />

      <WeeklyPortfolioBanner summary={portfolio} fillStatus={fillStatus} />
      <MyQueueFilters active={filter} summary={view.summary} />
      <MyQueueList view={view} />
      {filter !== "all" ? (
        <ListPagination
          label="Paginação da fila filtrada"
          state={{
            page: view.page,
            pageSize: view.pageSize,
            totalItems: view.filteredTotal,
            totalPages: view.totalPages,
          }}
          hrefForPage={(nextPage) => myQueueHref({ filter, page: nextPage })}
        />
      ) : null}
    </PageFrame>
  );
}
