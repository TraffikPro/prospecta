import { Box, Card, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { AuthEntryBrand } from "./auth-entry-brand";

type TaskAuthShellProps = {
  children: ReactNode;
};

/**
 * First-access / must-change-password shell: centered card, compact brand.
 * Aligned with login/public entry (F12) — no split, no promotional headline.
 */
export function TaskAuthShell({ children }: TaskAuthShellProps) {
  return (
    <Box
      as="main"
      minH="100dvh"
      bg="bg.subtle"
      overflowX="hidden"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={{ base: "5", md: "8" }}
      py={{ base: "6", md: "10" }}
    >
      <Stack
        width="full"
        maxW="400px"
        gap="6"
        align="stretch"
        data-testid="task-auth-shell"
      >
        <AuthEntryBrand testId="task-auth-brand" />

        <Card.Root
          width="full"
          variant="outline"
          borderRadius="surface"
          bg="bg"
        >
          <Card.Body px={{ base: "5", md: "8" }} py={{ base: "6", md: "8" }}>
            {children}
          </Card.Body>
        </Card.Root>
      </Stack>
    </Box>
  );
}
