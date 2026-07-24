import { Heading, Stack, Text } from "@chakra-ui/react";
import { notFound, redirect } from "next/navigation";

import { ActivityTimeline } from "@/features/activities/activity-timeline";
import { CreateActivityForm } from "@/features/activities/create-activity-form";
import { PageFrame } from "@/components/layout/page-frame";
import { SectionHeading } from "@/components/layout/page-heading";
import {
  ContextualNav,
  leadBreadcrumbItems,
} from "@/components/navigation";
import { IntelligenceCard } from "@/features/leads/components/intelligence";
import { LeadContactActions } from "@/features/leads/components/lead-contact-actions";
import { LeadInfoCard } from "@/features/leads/components/lead-info-card";
import { LeadNextActionCard } from "@/features/leads/components/lead-next-action-card";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { getNextAction, pickLatestOutcome } from "@/features/leads/next-action";
import { MoveStageForm } from "@/features/leads/move-stage-form";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getActivitiesForLead } from "@/server/services/activity.service";
import { getLeadById } from "@/server/services/lead.service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    filter?: string;
  }>;
};

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export default async function LeadDetailPage({ params, searchParams }: PageProps) {
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
  const query = await searchParams;
  const lead = await getLeadById(id);
  if (!lead) {
    notFound();
  }

  const { items: crumbItems, returnHref } = leadBreadcrumbItems(
    lead.companyName,
    query.from,
    query.filter,
  );

  const activities = await getActivitiesForLead(lead.id);
  const intelligence = parseLeadIntelligence(lead.intelligence);
  const nextAction = getNextAction({
    stage: lead.stage,
    nextFollowUpAt: lead.nextFollowUpAt,
    latestOutcome: pickLatestOutcome(activities),
  });
  const followUpLabel = lead.nextFollowUpAt
    ? formatDateTime(lead.nextFollowUpAt)
    : "—";

  return (
    <PageFrame width="detail" gap={{ base: "6", md: "8" }}>
      <ContextualNav items={crumbItems} />

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
        nextFollowUpLabel={followUpLabel}
      />

      <LeadNextActionCard view={nextAction} followUpLabel={followUpLabel} />

      <LeadContactActions phone={lead.phone} email={lead.email} />

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
            Inteligência do lead
          </Heading>
          <IntelligenceCard intelligence={intelligence} />
        </section>
      ) : null}

      {lead.notes ? (
        <Stack as="section" gap="2" aria-labelledby="notes-heading">
          <SectionHeading id="notes-heading">Notas</SectionHeading>
          <Text fontSize="sm" whiteSpace="pre-wrap">
            {lead.notes}
          </Text>
        </Stack>
      ) : null}

      <section
        id="register-activity"
        aria-labelledby="register-activity-heading"
        style={{ scrollMarginBottom: "6rem" }}
      >
        <CreateActivityForm leadId={lead.id} returnHref={returnHref} />
      </section>

      <Stack as="section" gap="3" aria-labelledby="history-heading">
        <SectionHeading id="history-heading">Histórico</SectionHeading>
        <ActivityTimeline
          activities={activities}
          nextFollowUpAt={lead.nextFollowUpAt}
        />
      </Stack>

      <section aria-labelledby="move-stage-heading">
        <MoveStageForm leadId={lead.id} currentStage={lead.stage} />
      </section>
    </PageFrame>
  );
}
