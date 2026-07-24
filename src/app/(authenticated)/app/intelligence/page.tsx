import { Heading, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  IntelligenceFilters,
  LeadScoreCard,
} from "@/features/leads/components/intelligence";
import { parseInboxFilters } from "@/features/leads/intelligence/inbox";
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
    <main>
      <Stack gap="6">
        <Stack gap="2">
          <Text fontSize="sm">
            <Link href="/app" className="underline underline-offset-2">
              ← Área autenticada
            </Link>
          </Text>
          <Heading as="h1" size="lg">
            Oportunidades prioritárias
          </Heading>
          <Text fontSize="sm" color="fg.muted">
            Fila operacional por score — abra, contate e registre o resultado no
            lead.
          </Text>
          <Text fontSize="sm" data-testid="intelligence-inbox-counts">
            {counts.HIGH} HIGH · {counts.MEDIUM} MEDIUM · {counts.LOW} LOW
            {filters.qualification !== "ALL" || filters.source !== "ALL"
              ? " (filtro ativo)"
              : ""}
          </Text>
        </Stack>

        <IntelligenceFilters filters={filters} />

        {items.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" data-testid="intelligence-inbox-empty">
            Nenhuma oportunidade com inteligência para este filtro.
          </Text>
        ) : (
          <Stack gap="3" data-testid="intelligence-inbox-list">
            {items.map((item) => (
              <LeadScoreCard key={item.id} item={item} />
            ))}
          </Stack>
        )}
      </Stack>
    </main>
  );
}
