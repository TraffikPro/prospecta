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

/**
 * Outreach suggestion — generated text, not objective fact.
 * Full pitch stays mounted (display toggled) so expand/copy remain reliable.
 */
export function PitchBox({ pitch }: PitchBoxProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Stack gap="3" data-testid="intelligence-pitch">
      <Stack gap="1">
        <Text fontSize="sm" fontWeight="semibold">
          Sugestão de abordagem
        </Text>
        <Text fontSize="xs" color="fg.muted">
          Texto gerado para apoiar o outreach — não é fato objetivo.
        </Text>
      </Stack>

      <Box id="intelligence-pitch-panel">
        <Text
          fontSize="sm"
          color="fg.muted"
          display={expanded ? "none" : "block"}
          data-testid="intelligence-pitch-preview"
        >
          {pitchPreview(pitch)}
        </Text>
        <Text
          fontSize="sm"
          whiteSpace="pre-wrap"
          color="fg"
          display={expanded ? "block" : "none"}
          data-testid="intelligence-pitch-text"
        >
          {pitch}
        </Text>
      </Box>

      <Stack gap="2" direction={{ base: "column", sm: "row" }}>
        <Button
          type="button"
          size="md"
          minH="touch"
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
              type="button"
              size="md"
              minH="touch"
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
