"use client";

import { useState } from "react";
import { Clipboard, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

type PitchBoxProps = {
  pitch: string;
};

export function PitchBox({ pitch }: PitchBoxProps) {
  const [expanded, setExpanded] = useState(false);

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

      {expanded ? (
        <Text
          fontSize="sm"
          whiteSpace="pre-wrap"
          color="fg"
          data-testid="intelligence-pitch-text"
        >
          {pitch}
        </Text>
      ) : (
        <Text fontSize="sm" color="fg.muted" data-testid="intelligence-pitch-preview">
          Toque em “Ver abordagem” para ler o pitch completo.
        </Text>
      )}

      <Stack gap="2" direction={{ base: "column", sm: "row" }}>
        <Button
          size="md"
          minH="11"
          variant="outline"
          colorPalette="gray"
          width={{ base: "full", sm: "auto" }}
          onClick={() => setExpanded((value) => !value)}
          data-testid="intelligence-pitch-toggle"
        >
          {expanded ? "Recolher abordagem" : "Ver abordagem"}
        </Button>
        <Clipboard.Root value={pitch}>
          <Clipboard.Trigger asChild>
            <Button
              size="md"
              minH="11"
              width={{ base: "full", sm: "auto" }}
              data-testid="intelligence-pitch-copy"
            >
              <Clipboard.Indicator copied="Copiado">
                Copiar abordagem
              </Clipboard.Indicator>
            </Button>
          </Clipboard.Trigger>
        </Clipboard.Root>
      </Stack>
    </Stack>
  );
}
