import Link from "next/link";
import { redirect } from "next/navigation";
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
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
        <Link
          href="/app/leads/new"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          + Novo Lead
        </Link>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-neutral-600">Nenhum lead cadastrado</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
          {leads.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/app/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <span className="font-medium text-neutral-900">
                  {lead.companyName}
                </span>
                <span className="text-neutral-500">{lead.stage}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
