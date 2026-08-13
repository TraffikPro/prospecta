import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { MyQueueFilters } from "@/features/leads/components/my-queue-filters";
import { MyQueueList } from "@/features/leads/components/my-queue-list";
import { MyQueueSummaryCards } from "@/features/leads/components/my-queue-summary";
import { WeeklyPortfolioBanner } from "@/features/portfolio/components/weekly-portfolio-banner";
import { parseMyQueueFilter } from "@/features/leads/my-queue";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getMyQueueForOwner } from "@/server/services/lead.service";
import { getPortfolioSummaryForUser } from "@/server/services/portfolio.service";

type MyLeadsPageProps = {
  searchParams: Promise<{
    filter?: string;
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
  const portfolio = await getPortfolioSummaryForUser(user.id);
  const view = await getMyQueueForOwner(user.id, filter);

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Minha fila" }]} />
      <PageHeading
        title="Minha operação"
        meta="Abra a fila e ataque o próximo passo — atrasados e follow-ups primeiro."
      />

      <WeeklyPortfolioBanner summary={portfolio} />
      <MyQueueSummaryCards summary={view.summary} activeFilter={filter} />
      <MyQueueFilters active={filter} summary={view.summary} />
      <MyQueueList view={view} />
    </PageFrame>
  );
}
