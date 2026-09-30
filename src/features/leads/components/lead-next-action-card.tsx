import NextLink from "next/link";
import { Alert, Heading, HStack, Stack, Text } from "@chakra-ui/react";

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
    <Stack
      gap="2"
      borderWidth="1px"
      borderColor="border"
      borderRadius="surface"
      bg="bg"
      px="3"
      py="3"
      data-testid="lead-next-action"
      data-follow-up-state={view.followUpState}
      data-action={view.actionLabel}
      data-terminal={isTerminal ? "true" : "false"}
    >
      <Heading as="h2" textStyle="sectionTitle" fontSize="md">
        Próxima ação
      </Heading>

      <HStack
        gap="3"
        align="baseline"
        justify="space-between"
        flexWrap="wrap"
      >
        <Stack gap="0" minW="0">
          <Text fontSize="xs" color="fg.muted" fontWeight="medium">
            Status atual
          </Text>
          <Text
            fontSize="sm"
            fontWeight="medium"
            data-testid="next-action-status"
          >
            {view.statusLabel}
          </Text>
        </Stack>
        <Stack gap="0" minW="0" textAlign="end">
          <Text fontSize="xs" color="fg.muted" fontWeight="medium">
            Follow-up
          </Text>
          <Text
            fontSize="sm"
            fontWeight="medium"
            data-testid="next-action-follow-up"
          >
            {followUpLabel}
          </Text>
        </Stack>
      </HStack>

      <Stack gap="0">
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

      {showMissingFollowUpGuidance ? (
        <Text
          fontSize="sm"
          color="fg.muted"
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
  );
}
