import { Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActivityTimeline } from "@/features/activities/activity-timeline";
import { CreateActivityForm } from "@/features/activities/create-activity-form";
import { IntelligenceCard } from "@/features/leads/components/intelligence";
import { LeadContactActions } from "@/features/leads/components/lead-contact-actions";
import { LeadInfoCard } from "@/features/leads/components/lead-info-card";
import { LeadNextActionCard } from "@/features/leads/components/lead-next-action-card";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { parseMyQueueFilter } from "@/features/leads/my-queue";
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

function queueReturnHref(from?: string, filter?: string): string {
  if (from !== "queue") {
    return "/app/my-leads";
  }
  const parsed = parseMyQueueFilter(filter);
  return parsed === "all" ? "/app/my-leads" : `/app/my-leads?filter=${parsed}`;
}

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
  const returnToQueue = queueReturnHref(query.from, query.filter);
  const lead = await getLeadById(id);
  if (!lead) {
    notFound();
  }

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
      <Stack
        as="main"
        gap={{ base: "6", md: "8" }}
      >
        <Stack gap="2" display={{ base: "none", md: "flex" }}>
          <Stack direction="row" gap="4" flexWrap="wrap" fontSize="sm">
            <ChakraLink asChild>
              <NextLink href="/app/leads">← Leads</NextLink>
            </ChakraLink>
            <ChakraLink asChild>
              <NextLink href="/app/my-leads">Minha fila</NextLink>
            </ChakraLink>
            <ChakraLink asChild>
              <NextLink href="/app/intelligence">Inteligência</NextLink>
            </ChakraLink>
            <ChakraLink asChild>
              <NextLink href="/app/pipeline">Pipeline</NextLink>
            </ChakraLink>
          </Stack>
        </Stack>

        <Stack gap="2" display={{ base: "flex", md: "none" }}>
          <ChakraLink asChild fontSize="sm">
            <NextLink href={returnToQueue}>← Minha fila</NextLink>
          </ChakraLink>
        </Stack>

        {/* 1. Empresa, stage e contato */}
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

        {/* 2. Próxima ação */}
        <LeadNextActionCard view={nextAction} followUpLabel={followUpLabel} />

        {/* 3. Ações de contato */}
        <LeadContactActions phone={lead.phone} email={lead.email} />

        {/* 4. Inteligência */}
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

        {/* 5. Registrar Activity */}
        <section
          id="register-activity"
          aria-labelledby="register-activity-heading"
          style={{ scrollMarginBottom: "6rem" }}
        >
          <CreateActivityForm
            leadId={lead.id}
            queueReturnHref={returnToQueue}
          />
        </section>

        {/* 6. Histórico */}
        <Stack as="section" gap="3" aria-labelledby="history-heading">
          <Heading as="h2" id="history-heading" size="md">
            Histórico
          </Heading>
          <ActivityTimeline
            activities={activities}
            nextFollowUpAt={lead.nextFollowUpAt}
          />
        </Stack>

        {/* 7. Alteração de stage */}
        <section aria-labelledby="move-stage-heading">
          <MoveStageForm leadId={lead.id} currentStage={lead.stage} />
        </section>
      </Stack>
  );
}
