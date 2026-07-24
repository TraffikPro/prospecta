"use client";

import { Flex, Stack, Text } from "@chakra-ui/react";

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
      <Flex gap="2" flexWrap="wrap">
        {signals.map((signal) => (
          <Text
            as="span"
            key={signal}
            fontSize="sm"
            px="2.5"
            py="1.5"
            borderRadius="md"
            borderWidth="1px"
            borderColor="border"
            bg="bg.muted"
            lineHeight="short"
          >
            {signalLabel(signal)}
          </Text>
        ))}
      </Flex>
    </Stack>
  );
}
