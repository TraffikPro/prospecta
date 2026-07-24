import { Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { MyQueueList } from "@/features/leads/components/my-queue-list";
import { MyQueueSummaryCards } from "@/features/leads/components/my-queue-summary";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getMyQueueForOwner } from "@/server/services/lead.service";

export default async function MyLeadsPage() {
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
  const view = await getMyQueueForOwner(user.id);

  return (
    <Stack as="main" gap="6">
      <Stack gap="1">
        <Heading as="h1" size="lg" fontWeight="semibold">
          Minha operação
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Fila dos seus leads ativos — próximo passo sem abrir o detalhe às
          cegas.
        </Text>
      </Stack>

      <MyQueueSummaryCards summary={view.summary} />
      <MyQueueList view={view} />
    </Stack>
  );
}
