"use client";

import { Card, Stack, Text } from "@chakra-ui/react";

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
    <Stack as="ol" gap="3" listStyleType="none">
      {activities.map((activity) => {
        const typeLabel =
          activity.type === "STAGE_CHANGE"
            ? "Mudança de stage"
            : activityTypeLabels[activity.type];

        return (
          <Card.Root
            as="li"
            key={activity.id}
            variant="outline"
            borderRadius="card"
            size="sm"
          >
            <Card.Body py="3" px="4">
              <Stack gap="1">
                <Text fontSize="xs" color="fg.muted">
                  {formatDateTime(activity.createdAt)}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {activity.author.name}
                </Text>
                <Text fontSize="sm">{typeLabel}</Text>
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
              </Stack>
            </Card.Body>
          </Card.Root>
        );
      })}
      {nextFollowUpAt ? (
        <Text as="li" fontSize="sm">
          <Text as="span" color="fg.muted">
            Próximo contato:{" "}
          </Text>
          {formatDateTime(nextFollowUpAt)}
        </Text>
      ) : null}
    </Stack>
  );
}
