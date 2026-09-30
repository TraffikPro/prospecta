import { Box, Card, Flex, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { LOGIN_BRAND_CONTEXT } from "@/features/auth/auth-entry-copy";

import { AuthEntryBrand } from "./auth-entry-brand";

type AuthShellProps = {
  children: ReactNode;
};

/**
 * Login entry shell — centered form, compact identity, no marketing split.
 * Form remains the primary visual job; brand establishes product trust only.
 */
export function AuthShell({ children }: AuthShellProps) {
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
        data-testid="login-auth-shell"
      >
        <AuthEntryBrand
          testId="login-brand-panel"
          context={LOGIN_BRAND_CONTEXT}
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

        {/* Legacy E2E marker — identity lives in login-brand-panel. */}
        <Flex display="none" data-testid="login-mobile-brand-bar" aria-hidden />
      </Stack>
    </Box>
  );
}
