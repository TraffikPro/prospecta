"use client";

import { useState } from "react";
import { Box, Clipboard, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

type PitchBoxProps = {
  pitch: string;
};

/** Collapsed visual hint only — never mutates the source pitch / Clipboard value. */
function pitchPreview(pitch: string): string {
  const compact = pitch.replace(/\s+/g, " ").trim();
  if (compact.length <= 120) {
    return compact;
  }
  return `${compact.slice(0, 117).trimEnd()}…`;
}

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

      <Box id="intelligence-pitch-panel">
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
          <Text
            fontSize="sm"
            color="fg.muted"
            aria-hidden="true"
            data-testid="intelligence-pitch-preview"
          >
            {pitchPreview(pitch)}
          </Text>
        )}
      </Box>

      <Stack gap="2" direction={{ base: "column", sm: "row" }}>
        <Button
          size="md"
          minH="11"
          variant="outline"
          colorPalette="gray"
          width={{ base: "full", sm: "auto" }}
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="intelligence-pitch-panel"
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
