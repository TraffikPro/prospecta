"use client";

import { List, Stack, Text } from "@chakra-ui/react";

import { signalLabel } from "@/features/leads/intelligence/signal-labels";

type SignalListProps = {
  signals: string[];
};

export function SignalList({ signals }: SignalListProps) {
  if (signals.length === 0) {
    return null;
  }

  return (
    <Stack gap="2" data-testid="intelligence-signals">
      <Text fontSize="sm" fontWeight="semibold">
        Sinais encontrados
      </Text>
      <List.Root gap="1.5" variant="plain" align="center">
        {signals.map((signal) => (
          <List.Item key={signal} fontSize="sm">
            <List.Indicator asChild color="success.fg">
              <span aria-hidden="true">✓</span>
            </List.Indicator>
            {signalLabel(signal)}
          </List.Item>
        ))}
      </List.Root>
    </Stack>
  );
}
