import NextLink from "next/link";
import { redirect } from "next/navigation";
import { Text } from "@chakra-ui/react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
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
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Leads" }]} />
      <PageHeading
        title="Leads"
        actions={
          <Button asChild size="md" minH="touch">
            <NextLink href="/app/leads/new">+ Novo Lead</NextLink>
          </Button>
        }
      />

      {leads.length === 0 ? (
        <Text textStyle="meta">Nenhum lead cadastrado</Text>
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
    </PageFrame>
  );
}
