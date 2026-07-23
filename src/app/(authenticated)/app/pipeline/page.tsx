import Link from "next/link";
import { redirect } from "next/navigation";
import { LEAD_STAGE_ORDER, leadStageLabels } from "@/features/leads/lead.labels";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getLeadsGroupedByStage } from "@/server/services/lead.service";

export default async function PipelinePage() {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const grouped = await getLeadsGroupedByStage();

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Pipeline</h1>
        <Link
          href="/app/leads"
          className="text-sm underline underline-offset-2"
        >
          Ver lista
        </Link>
      </div>

      <div className="space-y-6">
        {LEAD_STAGE_ORDER.map((stage) => {
          const leads = grouped[stage];
          return (
            <section
              key={stage}
              aria-labelledby={`stage-${stage}`}
              className="space-y-2"
              data-testid={`pipeline-stage-${stage}`}
            >
              <h2
                id={`stage-${stage}`}
                className="text-sm font-semibold uppercase tracking-wide text-neutral-600"
              >
                {leadStageLabels[stage]}{" "}
                <span className="font-normal text-neutral-400">
                  ({leads.length})
                </span>
              </h2>
              {leads.length === 0 ? (
                <p className="text-sm text-neutral-500">Nenhum lead</p>
              ) : (
                <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
                  {leads.map((lead) => (
                    <li key={lead.id}>
                      <Link
                        href={`/app/leads/${lead.id}`}
                        className="block px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                      >
                        {lead.companyName}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
