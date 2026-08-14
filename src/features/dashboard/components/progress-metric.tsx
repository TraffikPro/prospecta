"use client";

import { Progress, Stack, Text } from "@chakra-ui/react";

import { rateToProgressValue } from "@/features/dashboard/dashboard.format";

type ProgressMetricProps = {
  label: string;
  formatted: string;
  rate: number;
  "data-testid"?: string;
};

export function ProgressMetric({
  label,
  formatted,
  rate,
  "data-testid": testId,
}: ProgressMetricProps) {
  const value = rateToProgressValue(rate);
  const ariaLabel = `${label}: ${formatted}`;

  return (
    <Stack gap="2" minW="0" data-testid={testId}>
      <Stack direction="row" justify="space-between" gap="3" align="baseline">
        <Text fontSize="sm" fontWeight="medium">
          {label}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {formatted}
        </Text>
      </Stack>
      <Progress.Root
        value={value}
        max={100}
        size="sm"
        colorPalette="brand"
        aria-label={ariaLabel}
      >
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Stack>
  );
}
