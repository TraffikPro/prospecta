import { Alert, Card, Heading, HStack, Stack, Text } from "@chakra-ui/react";

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
      <Card.Body py="1.5" px="3">
        <Stack gap="1">
          <Heading as="h2" size="sm" lineHeight="1.2">
            Próxima ação
          </Heading>

          <HStack
            gap="3"
            align="baseline"
            justify="space-between"
            flexWrap="wrap"
          >
            <Stack gap="0" minW="0">
              <Text
                fontSize="xs"
                color="fg.muted"
                fontWeight="medium"
                lineHeight="1.2"
              >
                Status atual
              </Text>
              <Text
                fontSize="sm"
                fontWeight="medium"
                lineHeight="1.25"
                data-testid="next-action-status"
              >
                {view.statusLabel}
              </Text>
            </Stack>
            <Stack gap="0" minW="0" textAlign="end">
              <Text
                fontSize="xs"
                color="fg.muted"
                fontWeight="medium"
                lineHeight="1.2"
              >
                Follow-up
              </Text>
              <Text
                fontSize="sm"
                fontWeight="medium"
                lineHeight="1.25"
                data-testid="next-action-follow-up"
              >
                {followUpLabel}
              </Text>
            </Stack>
          </HStack>

          <Stack gap="0">
            <Text
              fontSize="xs"
              color="fg.muted"
              fontWeight="medium"
              lineHeight="1.2"
            >
              Ação recomendada
            </Text>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              lineHeight="1.25"
              data-testid="next-action-recommended"
            >
              {view.actionLabel}
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
