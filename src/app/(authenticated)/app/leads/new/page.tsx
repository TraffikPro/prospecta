import { redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { CreateLeadForm } from "@/features/leads/create-lead-form";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";

export default async function NewLeadPage() {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <PageFrame width="form" gap="6">
      <ContextualNav
        items={[
          { label: "Leads", href: "/app/leads" },
          { label: "Novo lead" },
        ]}
      />
      <PageHeading title="Novo lead" />
      <CreateLeadForm />
    </PageFrame>
  );
}
