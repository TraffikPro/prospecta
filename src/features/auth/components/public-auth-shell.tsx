import { Box, Card, Flex, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { PUBLIC_BRAND_CONTEXT } from "@/features/auth/auth-entry-copy";

import { AuthEntryBrand } from "./auth-entry-brand";

type PublicAuthShellProps = {
  children: ReactNode;
};

/**
 * Public recovery shell (forgot / reset) — same sober entry pattern as login.
 * No marketing panel, no pipeline illustration.
 */
export function PublicAuthShell({ children }: PublicAuthShellProps) {
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
        data-testid="public-auth-shell"
      >
        <AuthEntryBrand
          testId="public-auth-brand-panel"
          context={PUBLIC_BRAND_CONTEXT}
        />

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

        <Flex
          display="none"
          data-testid="public-auth-mobile-brand-bar"
          aria-hidden
        />
      </Stack>
    </Box>
  );
}
