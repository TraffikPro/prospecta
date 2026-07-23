import {
  activityOutcomeLabels,
  activityTypeLabels,
} from "@/features/activities/activity.labels";
import { formatStageChangeSummary } from "@/features/leads/stage-change";
import type { ActivityWithAuthor } from "@/server/repositories/activity.repository";

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

type Props = {
  activities: ActivityWithAuthor[];
  nextFollowUpAt: Date | null;
};

export function ActivityTimeline({ activities, nextFollowUpAt }: Props) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-neutral-600">Nenhuma atividade registrada.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {activities.map((activity) => {
        const typeLabel =
          activity.type === "STAGE_CHANGE"
            ? "Mudança de stage"
            : activityTypeLabels[activity.type];

        return (
          <li
            key={activity.id}
            className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm"
          >
            <p className="text-xs text-neutral-500">
              {formatDateTime(activity.createdAt)}
            </p>
            <p className="mt-1 font-medium text-neutral-900">
              {activity.author.name}
            </p>
            <p className="text-neutral-700">{typeLabel}</p>
            {activity.outcome ? (
              <p className="mt-2 text-neutral-700">
                <span className="text-neutral-500">Resultado: </span>
                {activityOutcomeLabels[activity.outcome]}
              </p>
            ) : null}
            {activity.body ? (
              <p className="mt-2 whitespace-pre-wrap text-neutral-800">
                {activity.type === "STAGE_CHANGE"
                  ? formatStageChangeSummary(activity.body)
                  : activity.body}
              </p>
            ) : null}
          </li>
        );
      })}
      {nextFollowUpAt ? (
        <li className="text-sm text-neutral-700">
          <span className="text-neutral-500">Próximo contato: </span>
          {formatDateTime(nextFollowUpAt)}
        </li>
      ) : null}
    </ol>
  );
}
