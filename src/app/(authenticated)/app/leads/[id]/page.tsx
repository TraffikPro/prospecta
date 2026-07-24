import { Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActivityTimeline } from "@/features/activities/activity-timeline";
import { CreateActivityForm } from "@/features/activities/create-activity-form";
import { IntelligenceCard } from "@/features/leads/components/intelligence";
import { LeadInfoCard } from "@/features/leads/components/lead-info-card";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { MoveStageForm } from "@/features/leads/move-stage-form";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getActivitiesForLead } from "@/server/services/activity.service";
import { getLeadById } from "@/server/services/lead.service";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export default async function LeadDetailPage({ params }: PageProps) {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) {
    notFound();
  }

  const activities = await getActivitiesForLead(lead.id);
  const intelligence = parseLeadIntelligence(lead.intelligence);

  return (
    <Stack as="main" gap="8">
      <Stack gap="2">
        <Stack direction="row" gap="4" flexWrap="wrap" fontSize="sm">
          <ChakraLink asChild>
            <NextLink href="/app/leads">← Leads</NextLink>
          </ChakraLink>
          <ChakraLink asChild>
            <NextLink href="/app/intelligence">Inteligência</NextLink>
          </ChakraLink>
          <ChakraLink asChild>
            <NextLink href="/app/pipeline">Pipeline</NextLink>
          </ChakraLink>
        </Stack>
      </Stack>

      <LeadInfoCard
        companyName={lead.companyName}
        contactName={lead.contactName}
        email={lead.email}
        phone={lead.phone}
        website={lead.website}
        stage={lead.stage}
        source={lead.source}
        ownerName={lead.owner.name}
        ownerEmail={lead.owner.email}
        nextFollowUpLabel={
          lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : "—"
        }
      />

      {intelligence ? (
        <section aria-labelledby="intelligence-heading">
          <Heading
            as="h2"
            id="intelligence-heading"
            position="absolute"
            width="1px"
            height="1px"
            padding="0"
            margin="-1px"
            overflow="hidden"
            clipPath="inset(50%)"
            whiteSpace="nowrap"
            borderWidth="0"
          >
            Lead Intelligence
          </Heading>
          <IntelligenceCard intelligence={intelligence} />
        </section>
      ) : null}

      {lead.notes ? (
        <Stack as="section" gap="2" aria-labelledby="notes-heading">
          <Heading as="h2" id="notes-heading" size="md">
            Notas
          </Heading>
          <Text fontSize="sm" whiteSpace="pre-wrap">
            {lead.notes}
          </Text>
        </Stack>
      ) : null}

      <Stack as="section" gap="3" aria-labelledby="history-heading">
        <Heading as="h2" id="history-heading" size="md">
          Histórico
        </Heading>
        <ActivityTimeline
          activities={activities}
          nextFollowUpAt={lead.nextFollowUpAt}
        />
      </Stack>

      <section aria-labelledby="move-stage-heading">
        <MoveStageForm leadId={lead.id} currentStage={lead.stage} />
      </section>

      <section aria-labelledby="register-activity-heading">
        <CreateActivityForm
          key={`activity-form-${activities.length}`}
          leadId={lead.id}
        />
      </section>
    </Stack>
  );
}
