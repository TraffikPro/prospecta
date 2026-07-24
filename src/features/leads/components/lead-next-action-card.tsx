import { Alert, Card, Heading, Stack, Text } from "@chakra-ui/react";

import type { NextActionView } from "@/features/leads/next-action";

type LeadNextActionCardProps = {
  view: NextActionView;
  followUpLabel: string;
};

export function LeadNextActionCard({
  view,
  followUpLabel,
}: LeadNextActionCardProps) {
  return (
    <Card.Root
      variant="outline"
      borderRadius="card"
      data-testid="lead-next-action"
      data-follow-up-state={view.followUpState}
      data-action={view.actionLabel}
    >
      <Card.Body>
        <Stack gap="4">
          <Heading as="h2" size="md">
            Próxima ação
          </Heading>

          <Stack gap="1">
            <Text fontSize="xs" color="fg.muted" fontWeight="medium">
              Status atual
            </Text>
            <Text fontSize="sm" fontWeight="medium" data-testid="next-action-status">
              {view.statusLabel}
            </Text>
          </Stack>

          <Stack gap="1">
            <Text fontSize="xs" color="fg.muted" fontWeight="medium">
              Ação recomendada
            </Text>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              data-testid="next-action-recommended"
            >
              {view.actionLabel}
            </Text>
          </Stack>

          <Stack gap="1">
            <Text fontSize="xs" color="fg.muted" fontWeight="medium">
              Follow-up
            </Text>
            <Text fontSize="sm" data-testid="next-action-follow-up">
              {followUpLabel}
            </Text>
          </Stack>

          {view.followUpState === "due_today" ? (
            <Alert.Root status="warning" variant="subtle" size="sm">
              <Alert.Indicator />
              <Alert.Title>Follow-up hoje</Alert.Title>
            </Alert.Root>
          ) : null}

          {view.followUpState === "overdue" ? (
            <Alert.Root status="error" variant="subtle" size="sm">
              <Alert.Indicator />
              <Alert.Title>Follow-up atrasado</Alert.Title>
            </Alert.Root>
          ) : null}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
