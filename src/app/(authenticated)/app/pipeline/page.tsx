import Link from "next/link";
import { redirect } from "next/navigation";
import { Link as ChakraLink } from "@chakra-ui/react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { Button } from "@/components/ui/button";
import { LEAD_STAGE_ORDER } from "@/features/leads/lead.labels";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getPipelineView } from "@/server/services/lead.service";

type PageProps = {
  searchParams: Promise<{
    stage?: string | string[];
    page?: string | string[];
  }>;
};

export default async function PipelinePage({ searchParams }: PageProps) {
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
  const view = await getPipelineView(sessionUser!, {
    stage: Array.isArray(params.stage) ? params.stage[0] : params.stage,
    page: Array.isArray(params.page) ? params.page[0] : params.page,
  });
  const totalLeads = LEAD_STAGE_ORDER.reduce(
    (sum, stage) => sum + view.counts[stage],
    0,
  );

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Pipeline" }]} />
      <PageHeading
        title="Pipeline"
        meta="Etapas recolhíveis — abra a que precisa e use Ver todos quando houver muitos leads."
        actions={
          <ChakraLink
            asChild
            fontSize="sm"
            textDecoration="underline"
            minH="touch"
            display="inline-flex"
            alignItems="center"
          >
            <Link href="/app/leads">Ver lista</Link>
          </ChakraLink>
        }
      />

      {totalLeads === 0 ? (
        <AppEmptyState
          data-testid="pipeline-empty"
          title="Nenhum lead no pipeline."
          description="Cadastre um lead ou sincronize oportunidades para começar a mover etapas."
          action={
            <Button asChild size="md" minH="touch">
              <Link href="/app/leads/new">Cadastrar lead</Link>
            </Button>
          }
        />
      ) : (
        <PipelineBoard
          grouped={view.grouped}
          counts={view.counts}
          selectedStage={view.selectedStage}
          page={view.page}
          totalPages={view.totalPages}
        />
      )}
    </PageFrame>
  );
}
