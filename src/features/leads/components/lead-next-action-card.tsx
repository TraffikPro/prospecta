import NextLink from "next/link";
import { Alert, Card, Heading, HStack, Stack, Text } from "@chakra-ui/react";

import type { NextActionView } from "@/features/leads/next-action";

type LeadNextActionCardProps = {
  view: NextActionView;
  followUpLabel: string;
  /** Presentation-only: suppress residual follow-up urgency on WON/LOST. */
  isTerminal?: boolean;
};

export function LeadNextActionCard({
  view,
  followUpLabel,
  isTerminal = false,
}: LeadNextActionCardProps) {
  const showUrgency =
    !isTerminal &&
    (view.followUpState === "due_today" || view.followUpState === "overdue");
  const showMissingFollowUpGuidance =
    !isTerminal && view.followUpState === "none";

  return (
    <Card.Root
      variant="outline"
      borderRadius="card"
      data-testid="lead-next-action"
      data-follow-up-state={view.followUpState}
      data-action={view.actionLabel}
      data-terminal={isTerminal ? "true" : "false"}
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

          {showMissingFollowUpGuidance ? (
            <Text
              fontSize="sm"
              color="fg.muted"
              lineHeight="1.35"
              data-testid="next-action-follow-up-guidance"
            >
              Registre uma atividade para definir o próximo passo.{" "}
              <NextLink
                href="#register-activity"
                style={{
                  color: "inherit",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                Registrar atividade
              </NextLink>
            </Text>
          ) : null}

          {showUrgency && view.followUpState === "due_today" ? (
            <Alert.Root status="warning" variant="subtle" size="sm">
              <Alert.Indicator />
              <Alert.Title>Follow-up hoje</Alert.Title>
            </Alert.Root>
          ) : null}

          {showUrgency && view.followUpState === "overdue" ? (
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
