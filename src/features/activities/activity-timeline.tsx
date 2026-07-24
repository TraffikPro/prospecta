"use client";

import { Text, Timeline } from "@chakra-ui/react";

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
      <Text fontSize="sm" color="fg.muted">
        Nenhuma atividade registrada.
      </Text>
    );
  }

  return (
    <Timeline.Root size="sm" variant="subtle" data-testid="activity-timeline">
      {activities.map((activity) => {
        const typeLabel =
          activity.type === "STAGE_CHANGE"
            ? "Mudança de etapa"
            : activityTypeLabels[activity.type];

        return (
          <Timeline.Item key={activity.id}>
            <Timeline.Connector>
              <Timeline.Separator />
              <Timeline.Indicator />
            </Timeline.Connector>
            <Timeline.Content>
              <Timeline.Description>
                {formatDateTime(activity.createdAt)}
              </Timeline.Description>
              <Timeline.Title>
                {activity.author.name} · {typeLabel}
              </Timeline.Title>
              {activity.outcome ? (
                <Text fontSize="sm">
                  <Text as="span" color="fg.muted">
                    Resultado:{" "}
                  </Text>
                  {activityOutcomeLabels[activity.outcome]}
                </Text>
              ) : null}
              {activity.body ? (
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {activity.type === "STAGE_CHANGE"
                    ? formatStageChangeSummary(activity.body)
                    : activity.body}
                </Text>
              ) : null}
            </Timeline.Content>
          </Timeline.Item>
        );
      })}
      {nextFollowUpAt ? (
        <Timeline.Item>
          <Timeline.Connector>
            <Timeline.Separator />
            <Timeline.Indicator />
          </Timeline.Connector>
          <Timeline.Content>
            <Timeline.Title>
              <Text as="span" color="fg.muted" fontWeight="normal">
                Próximo contato:{" "}
              </Text>
              {formatDateTime(nextFollowUpAt)}
            </Timeline.Title>
          </Timeline.Content>
        </Timeline.Item>
      ) : null}
    </Timeline.Root>
  );
}
