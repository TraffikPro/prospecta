import { Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import {
  IntelligenceFilters,
  LeadScoreCard,
} from "@/features/leads/components/intelligence";
import { parseInboxFilters } from "@/features/leads/intelligence/inbox";
import { qualificationLabels } from "@/features/leads/lead.labels";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getIntelligenceInbox } from "@/server/services/lead.service";

type PageProps = {
  searchParams: Promise<{
    qualification?: string | string[];
    source?: string | string[];
  }>;
};

export default async function IntelligenceInboxPage({ searchParams }: PageProps) {
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
  const filters = parseInboxFilters(params);
  const { items, counts } = await getIntelligenceInbox(filters);

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Inteligência" }]} />
      <PageHeading
        title="Oportunidades prioritárias"
        meta="Fila operacional por score — abra, contate e registre o resultado no lead."
      />
      <Text fontSize="sm" data-testid="intelligence-inbox-counts">
        {counts.HIGH} {qualificationLabels.HIGH} · {counts.MEDIUM}{" "}
        {qualificationLabels.MEDIUM} · {counts.LOW} {qualificationLabels.LOW}
        {filters.qualification !== "ALL" || filters.source !== "ALL"
          ? " (filtro ativo)"
          : ""}
      </Text>

      <IntelligenceFilters filters={filters} />

      {items.length === 0 ? (
        <Text
          fontSize="sm"
          color="fg.muted"
          data-testid="intelligence-inbox-empty"
        >
          Nenhuma oportunidade com inteligência para este filtro.
        </Text>
      ) : (
        <Stack gap="3" data-testid="intelligence-inbox-list">
          {items.map((item) => (
            <LeadScoreCard key={item.id} item={item} />
          ))}
        </Stack>
      )}
    </PageFrame>
  );
}
