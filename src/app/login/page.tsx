import { Alert, Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import {
  isSessionExpiredReason,
  SESSION_EXPIRED_MESSAGE,
} from "@/server/auth/login-redirect";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();
  if (user) {
    redirect("/app");
  }

  const params = await searchParams;
  const showSessionExpired = isSessionExpiredReason(params.reason);

  return (
    <Box
      as="main"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px="6"
      py="10"
      bg="bg.subtle"
    >
      <Card.Root
        width="full"
        maxW="sm"
        variant="outline"
        borderRadius="card"
      >
        <Card.Header>
          <Stack gap="2">
            <Heading as="h1" size="xl">
              Prospecta
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              Entre com sua conta do time fundador.
            </Text>
          </Stack>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            {showSessionExpired ? (
              <Alert.Root
                status="warning"
                variant="subtle"
                role="status"
                data-testid="session-expired-alert"
              >
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{SESSION_EXPIRED_MESSAGE}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : null}
            <LoginForm />
          </Stack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
