import { forbidden, redirect } from "next/navigation";

import { Stack, Text } from "@chakra-ui/react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { AcquisitionJobsTable } from "@/features/acquisition/components/acquisition-jobs-table";
import { AcquisitionRequestForm } from "@/features/acquisition/components/acquisition-request-form";
import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireCanRunAcquisition } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { listAcquisitionJobsForOperator } from "@/server/services/acquisition-job.service";

export default async function AdminAcquisitionPage() {
  const sessionUser = await getSessionUser();

  try {
    requireCanRunAcquisition(sessionUser);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    if (error instanceof AuthorizationError) {
      forbidden();
    }
    throw error;
  }

  const jobs = await listAcquisitionJobsForOperator();

  return (
    <PageFrame width="list" gap="8">
      <ContextualNav
        items={[
          { label: "Mais", href: "/app/more" },
          { label: "Aquisição" },
        ]}
      />
      <PageHeading
        title="Aquisição"
        meta="Solicitar pull Places via runner externo."
      />

      <Stack gap="4">
        <Text fontSize="sm" color="fg.muted">
          Places API fica no lead-generator. O Prospecta só cria o job, acompanha
          o status e recebe os leads na Intelligence Inbox.
        </Text>
        <AcquisitionRequestForm />
      </Stack>

      <Stack gap="3">
        <Text fontWeight="semibold">Histórico recente</Text>
        <AcquisitionJobsTable jobs={jobs} />
      </Stack>
    </PageFrame>
  );
}
