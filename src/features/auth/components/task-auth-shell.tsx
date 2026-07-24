import { Box, Card, Flex, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { ProspectaMark } from "./prospecta-mark";

type TaskAuthShellProps = {
  children: ReactNode;
};

/**
 * First-access / task identity layout: centered card, compact brand, no split.
 * No PipelineGraphic and no promotional headline.
 */
export function TaskAuthShell({ children }: TaskAuthShellProps) {
  return (
    <Box
      as="main"
      minH="100vh"
      bg="bg.subtle"
      overflowX="hidden"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={{ base: "5", lg: "12" }}
      py={{ base: "8", lg: "10" }}
    >
      <Stack
        width="full"
        maxW="440px"
        gap="6"
        align="stretch"
        data-testid="task-auth-shell"
      >
        <Flex
          align="center"
          justify="center"
          gap="2.5"
          data-testid="task-auth-brand"
        >
          <ProspectaMark size={32} />
          <Box>
            <Text
              as="span"
              display="block"
              fontSize="md"
              fontWeight="semibold"
              color="fg"
              lineHeight="1.1"
              data-testid="prospecta-wordmark"
            >
              Prospecta
            </Text>
            <Text as="span" display="block" fontSize="xs" color="fg.muted">
              por DevFlow Labs
            </Text>
          </Box>
        </Flex>

        <Card.Root width="full" maxW="440px" variant="outline" borderRadius="card">
          <Card.Body px={{ base: "6", lg: "10" }} py={{ base: "8", lg: "10" }}>
            {children}
          </Card.Body>
        </Card.Root>
      </Stack>
    </Box>
  );
}
