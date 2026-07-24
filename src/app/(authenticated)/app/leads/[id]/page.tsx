import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ActivityTimeline } from "@/features/activities/activity-timeline";
import { CreateActivityForm } from "@/features/activities/create-activity-form";
import { IntelligenceCard } from "@/features/leads/components/intelligence";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { MoveStageForm } from "@/features/leads/move-stage-form";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getActivitiesForLead } from "@/server/services/activity.service";
import { getLeadById } from "@/server/services/lead.service";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

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

  const activities = await getActivitiesForLead(lead.id);
  const intelligence = parseLeadIntelligence(lead.intelligence);

  return (
    <main className="space-y-8">
      <div className="space-y-1">
        <p className="flex flex-wrap gap-3 text-sm">
          <Link href="/app/leads" className="underline underline-offset-2">
            ← Leads
          </Link>
          <Link href="/app/pipeline" className="underline underline-offset-2">
            Pipeline
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
          <dd className="font-medium" data-testid="lead-stage">
            {lead.stage}
          </dd>
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
          <dt className="text-neutral-500">Origem</dt>
          <dd className="font-medium" data-testid="lead-source">
            {lead.source}
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Owner</dt>
          <dd className="font-medium">
            {lead.owner.name} ({lead.owner.email})
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">Próximo contato</dt>
          <dd className="font-medium" data-testid="lead-next-follow-up">
            {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : "—"}
          </dd>
        </div>
      </dl>

      {intelligence ? (
        <section aria-labelledby="intelligence-heading">
          <h2 id="intelligence-heading" className="sr-only">
            Lead Intelligence
          </h2>
          <IntelligenceCard intelligence={intelligence} />
        </section>
      ) : null}

      {lead.notes ? (
        <section className="space-y-2" aria-labelledby="notes-heading">
          <h2 id="notes-heading" className="text-base font-semibold">
            Notas
          </h2>
          <p className="whitespace-pre-wrap text-sm text-neutral-800">
            {lead.notes}
          </p>
        </section>
      ) : null}

      <section className="space-y-3" aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-base font-semibold">
          Histórico
        </h2>
        <ActivityTimeline
          activities={activities}
          nextFollowUpAt={lead.nextFollowUpAt}
        />
      </section>

      <section aria-labelledby="move-stage-heading">
        <MoveStageForm leadId={lead.id} currentStage={lead.stage} />
      </section>

      <section aria-labelledby="register-activity-heading">
        <CreateActivityForm
          key={`activity-form-${activities.length}`}
          leadId={lead.id}
        />
      </section>
    </main>
  );
}
