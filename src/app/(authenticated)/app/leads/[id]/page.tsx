import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getLeadById } from "@/server/services/lead.service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
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
  const lead = await getLeadById(id);
  if (!lead) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm">
          <Link href="/app/leads" className="underline underline-offset-2">
            ← Leads
          </Link>
        </p>
        <h1 className="text-xl font-semibold tracking-tight">
          {lead.companyName}
        </h1>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-neutral-500">Contato</dt>
          <dd className="font-medium">{lead.contactName || "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Stage</dt>
          <dd className="font-medium">{lead.stage}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">E-mail</dt>
          <dd className="font-medium">{lead.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Telefone</dt>
          <dd className="font-medium">{lead.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Website</dt>
          <dd className="font-medium">{lead.website || "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Owner</dt>
          <dd className="font-medium">
            {lead.owner.name} ({lead.owner.email})
          </dd>
        </div>
      </dl>
    </main>
  );
}
