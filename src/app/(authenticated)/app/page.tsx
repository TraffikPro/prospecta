import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { DashboardLoadError } from "@/features/dashboard/components/dashboard-load-error";
import { OperationalOverview } from "@/features/dashboard/components/operational-overview";
import { buildDashboardView } from "@/features/dashboard/dashboard.view";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getOperationalDashboard } from "@/server/services/dashboard.service";

export default async function AppHomePage() {
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
  let view = null;
  try {
    const dashboard = await getOperationalDashboard({ actorId: user.id });
    view = buildDashboardView(dashboard.kind, dashboard.kpis);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    console.error("Failed to load operational dashboard");
  }

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Visão geral" }]} />
      <PageHeading
        title="Visão geral"
        meta={
          view?.subtitle ??
          "Acompanhe a meta, a carteira e a execução comercial da semana."
        }
      />
      {view ? <OperationalOverview view={view} /> : <DashboardLoadError />}
    </PageFrame>
  );
}
