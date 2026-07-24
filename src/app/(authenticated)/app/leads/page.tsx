import { Heading, HStack, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LeadTable } from "@/features/leads/components/lead-table";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getLeads } from "@/server/services/lead.service";

export default async function LeadsPage() {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const leads = await getLeads();

  return (
    <Stack as="main" gap="6">
      <HStack justify="space-between" align="center" gap="4">
        <Heading as="h1" size="lg">
          Leads
        </Heading>
        <Button asChild size="sm">
          <NextLink href="/app/leads/new">+ Novo Lead</NextLink>
        </Button>
      </HStack>

      {leads.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          Nenhum lead cadastrado
        </Text>
      ) : (
        <LeadTable
          leads={leads.map((lead) => ({
            id: lead.id,
            companyName: lead.companyName,
            stage: lead.stage,
            source: lead.source,
          }))}
        />
      )}
    </Stack>
  );
}
