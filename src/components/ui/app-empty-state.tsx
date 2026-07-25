import type { ReactNode } from "react";

import { EmptyState, Stack, Text } from "@chakra-ui/react";

type AppEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Full page/filter empty vs compact stage/column empty. */
  variant?: "full" | "compact";
  "data-testid"?: string;
};

/**
 * Operational empty state — explains why there is nothing and the next action.
 */
export function AppEmptyState({
  title,
  description,
  action,
  variant = "full",
  "data-testid": testId,
}: AppEmptyStateProps) {
  if (variant === "compact") {
    if (!description && !action) {
      return (
        <Text fontSize="sm" color="fg.muted" data-testid={testId} py="1">
          {title}
        </Text>
      );
    }

    return (
      <Stack gap="1" data-testid={testId} py="1">
        <Text fontSize="sm" fontWeight="medium" color="fg" lineHeight="1.3">
          {title}
        </Text>
        {description ? (
          <Text fontSize="sm" color="fg.muted" lineHeight="1.35">
            {description}
          </Text>
        ) : null}
        {action}
      </Stack>
    );
  }

  return (
    <EmptyState.Root data-testid={testId} size="sm" py="4">
      <EmptyState.Content alignItems="flex-start" textAlign="start" gap="2">
        <EmptyState.Title>{title}</EmptyState.Title>
        {description ? (
          <EmptyState.Description>{description}</EmptyState.Description>
        ) : null}
        {action}
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
