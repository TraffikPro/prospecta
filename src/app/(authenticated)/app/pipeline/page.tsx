import Link from "next/link";
import { redirect } from "next/navigation";
import { Link as ChakraLink } from "@chakra-ui/react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getLeadsGroupedByStage } from "@/server/services/lead.service";

export default async function PipelinePage() {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const grouped = await getLeadsGroupedByStage();

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

      <PipelineBoard grouped={grouped} />
    </PageFrame>
  );
}
