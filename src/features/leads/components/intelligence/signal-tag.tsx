"use client";

import { Badge } from "@chakra-ui/react";

import { signalLabel } from "@/features/leads/intelligence/signal-labels";

type SignalTagProps = {
  signal: string;
};

export function SignalTag({ signal }: SignalTagProps) {
  return (
    <Badge colorPalette="gray" variant="subtle" size="sm">
      {signalLabel(signal)}
    </Badge>
  );
}
