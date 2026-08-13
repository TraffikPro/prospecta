import { Heading, Stack } from "@chakra-ui/react";
import { forbidden, notFound, redirect } from "next/navigation";

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
import { LeadDetailLayout } from "@/features/leads/components/lead-detail-layout";
import { LeadInfoCard } from "@/features/leads/components/lead-info-card";
import { LeadIntelligenceFallback } from "@/features/leads/components/lead-intelligence-fallback";
import { LeadNextActionCard } from "@/features/leads/components/lead-next-action-card";
import { LeadOriginDetails } from "@/features/leads/components/lead-origin-details";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { sanitizeLeadNotes } from "@/features/leads/intelligence/sanitize-notes";
import { getNextAction, pickLatestOutcome } from "@/features/leads/next-action";
import { MoveStageForm } from "@/features/leads/move-stage-form";
import { LeadReassignForm } from "@/features/portfolio/components/lead-reassign-form";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getActivitiesForLead } from "@/server/services/activity.service";
import { getLeadById } from "@/server/services/lead.service";
import { listAssignableOperators } from "@/server/services/portfolio.service";

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

  if (sessionUser!.role === "MEMBER" && lead.ownerId !== sessionUser!.id) {
    forbidden();
  }

  const assignableOperators =
    sessionUser!.role === "ADMIN" ? await listAssignableOperators() : [];

  const { items: crumbItems, returnHref } = leadBreadcrumbItems(
    lead.companyName,
    query.from,
    query.filter,
  );

  const activities = await getActivitiesForLead(lead.id);
  const intelligence = parseLeadIntelligence(lead.intelligence);
  const displayNotes = sanitizeLeadNotes(lead.notes, {
    signals: intelligence?.signals,
    diagnostic: intelligence?.diagnostic,
    pitch: intelligence?.pitch,
    score: intelligence?.score,
    rating: intelligence?.rating,
    reviews: intelligence?.reviews,
  });
  const nextAction = getNextAction({
    stage: lead.stage,
    nextFollowUpAt: lead.nextFollowUpAt,
    latestOutcome: pickLatestOutcome(activities),
  });
  const isTerminal = lead.stage === "WON" || lead.stage === "LOST";
  const followUpLabel = lead.nextFollowUpAt
    ? formatDateTime(lead.nextFollowUpAt)
    : "Não definido";

  return (
    <PageFrame width="detailWide" gap={{ base: "6", md: "8" }}>
      <ContextualNav items={crumbItems} />

      <LeadInfoCard
        companyName={lead.companyName}
        email={lead.email}
        phone={lead.phone}
        stage={lead.stage}
        source={lead.source}
        ownerName={lead.owner.name}
        ownerEmail={lead.owner.email}
      />

      <LeadDetailLayout
        nextAction={
          <LeadNextActionCard
            view={nextAction}
            followUpLabel={followUpLabel}
            isTerminal={isTerminal}
          />
        }
        contact={<LeadContactActions phone={lead.phone} email={lead.email} />}
        intelligence={
          intelligence ? (
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
          ) : (
            <LeadIntelligenceFallback source={lead.source} />
          )
        }
        activity={
          <section
            id="register-activity"
            tabIndex={-1}
            aria-labelledby="register-activity-heading"
            style={{
              scrollMarginTop: "6rem",
              scrollMarginBottom: "6rem",
            }}
          >
            <CreateActivityForm leadId={lead.id} returnHref={returnHref} />
          </section>
        }
        history={
          <Stack as="section" gap="3" aria-labelledby="history-heading">
            <SectionHeading id="history-heading">Histórico</SectionHeading>
            <ActivityTimeline
              activities={activities}
              nextFollowUpAt={lead.nextFollowUpAt}
            />
          </Stack>
        }
        stage={
          <Stack gap="4">
            <section aria-labelledby="move-stage-heading">
              <MoveStageForm
                key={lead.stage}
                leadId={lead.id}
                currentStage={lead.stage}
              />
            </section>
            {sessionUser!.role === "ADMIN" ? (
              <LeadReassignForm
                leadId={lead.id}
                currentOwnerId={lead.ownerId}
                operators={assignableOperators}
              />
            ) : null}
          </Stack>
        }
        origin={
          <LeadOriginDetails
            contactName={lead.contactName}
            website={lead.website}
            nextFollowUpLabel={followUpLabel}
            notes={displayNotes}
          />
        }
      />
    </PageFrame>
  );
}
