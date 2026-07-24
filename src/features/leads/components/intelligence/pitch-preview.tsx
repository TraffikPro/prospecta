"use client";

import { Text } from "@chakra-ui/react";

type PitchPreviewProps = {
  pitch: string;
  maxChars?: number;
};

export function PitchPreview({ pitch, maxChars = 120 }: PitchPreviewProps) {
  const trimmed = pitch.trim();
  const preview =
    trimmed.length > maxChars
      ? `${trimmed.slice(0, maxChars).trimEnd()}…`
      : trimmed;

  return (
    <Text fontSize="sm" color="fg.muted" lineClamp={2}>
      {preview}
    </Text>
  );
}
