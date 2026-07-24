import { Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { ContextualNav } from "@/components/navigation";
import { MyQueueFilters } from "@/features/leads/components/my-queue-filters";
import { MyQueueList } from "@/features/leads/components/my-queue-list";
import { MyQueueSummaryCards } from "@/features/leads/components/my-queue-summary";
import { parseMyQueueFilter } from "@/features/leads/my-queue";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getMyQueueForOwner } from "@/server/services/lead.service";

type MyLeadsPageProps = {
  searchParams: Promise<{
    filter?: string;
  }>;
};

export default async function MyLeadsPage({ searchParams }: MyLeadsPageProps) {
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
  const params = await searchParams;
  const filter = parseMyQueueFilter(params.filter);
  const view = await getMyQueueForOwner(user.id, filter);

  return (
    <Stack as="main" gap="6">
      <ContextualNav items={[{ label: "Minha fila" }]} />
      <Stack gap="1">
        <Heading as="h1" size="lg" fontWeight="semibold">
          Minha operação
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Abra a fila e ataque o próximo passo — atrasados e follow-ups primeiro.
        </Text>
      </Stack>

      <MyQueueSummaryCards summary={view.summary} activeFilter={filter} />
      <MyQueueFilters active={filter} summary={view.summary} />
      <MyQueueList view={view} />
    </Stack>
  );
}
