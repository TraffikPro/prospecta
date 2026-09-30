import { Box, Flex, Text } from "@chakra-ui/react";

import { ProspectaMark } from "./prospecta-mark";

type AuthEntryBrandProps = {
  /** Optional one-line product context under the wordmark. */
  context?: string;
  /** Stable test id for the brand block (login vs public recovery). */
  testId?: string;
};

/**
 * Compact Prospecta identity for unauthenticated entry shells.
 * Typographic + existing mark only — no marketing hero.
 */
export function AuthEntryBrand({
  context,
  testId = "auth-entry-brand",
}: AuthEntryBrandProps) {
  return (
    <Flex
      align="center"
      gap="3"
      data-testid={testId}
      width="full"
      justify="center"
    >
      <ProspectaMark size={36} />
      <Box>
        <Text
          as="span"
          display="block"
          fontSize="md"
          fontWeight="semibold"
          color="fg"
          lineHeight="1.1"
          letterSpacing="tight"
          data-testid="prospecta-wordmark"
        >
          Prospecta
        </Text>
        <Text as="span" display="block" fontSize="xs" color="fg.muted">
          por DevFlow Labs
        </Text>
        {context ? (
          <Text
            as="span"
            display="block"
            fontSize="xs"
            color="fg.muted"
            mt="1"
            data-testid="auth-entry-context"
          >
            {context}
          </Text>
        ) : null}
      </Box>
    </Flex>
  );
}
