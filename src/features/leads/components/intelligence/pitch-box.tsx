"use client";

import { Clipboard, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

type PitchBoxProps = {
  pitch: string;
};

export function PitchBox({ pitch }: PitchBoxProps) {
  return (
    <Stack
      gap="3"
      p="4"
      borderWidth="1px"
      borderColor="brand.emphasized"
      bg="brand.subtle"
      borderRadius="card"
      data-testid="intelligence-pitch"
    >
      <Text fontSize="sm" fontWeight="semibold">
        Sugestão de abordagem
      </Text>
      <Text
        fontSize="sm"
        whiteSpace="pre-wrap"
        color="fg"
        data-testid="intelligence-pitch-text"
      >
        {pitch}
      </Text>
      <Clipboard.Root value={pitch}>
        <Clipboard.Trigger asChild>
          <Button size="sm" variant="outline" data-testid="intelligence-pitch-copy">
            <Clipboard.Indicator copied="Copiado">
              Copiar abordagem
            </Clipboard.Indicator>
          </Button>
        </Clipboard.Trigger>
      </Clipboard.Root>
    </Stack>
  );
}
