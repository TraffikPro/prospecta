import { Box, Card, Flex, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { AuthBrandPanel } from "./auth-brand-panel";
import { ProspectaMark } from "./prospecta-mark";

type AuthShellProps = {
  children: ReactNode;
};

/**
 * Login layout shell: desktop brand split + mobile top bar.
 * Validated only on `/login` in this slice — not a global identity layout yet.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <Box as="main" minH="100vh" bg="bg.subtle" overflowX="hidden">
      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", lg: "55fr 45fr" }}
        minH="100vh"
      >
        <Box display={{ base: "none", lg: "block" }}>
          <AuthBrandPanel />
        </Box>

        <Flex direction="column" minH="100vh" bg="bg.subtle">
          <Flex
            display={{ base: "flex", lg: "none" }}
            align="center"
            gap="2.5"
            px="6"
            py="5"
            bg="brand.950"
            data-testid="login-mobile-brand-bar"
          >
            <ProspectaMark size={32} light />
            <Text
              as="span"
              fontSize="sm"
              fontWeight="semibold"
              color="white"
              lineHeight="short"
              data-testid="prospecta-wordmark"
            >
              Prospecta · por DevFlow Labs
            </Text>
          </Flex>

          <Flex
            flex="1"
            align="center"
            justify="center"
            px={{ base: "5", lg: "12" }}
            py={{ base: "8", lg: "10" }}
          >
            <Card.Root
              width="full"
              maxW="440px"
              variant="outline"
              borderRadius="card"
            >
              <Card.Body px={{ base: "6", lg: "10" }} py={{ base: "8", lg: "10" }}>
                {children}
              </Card.Body>
            </Card.Root>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
