import { Alert, Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/features/auth/change-password-form";
import {
  APP_HOME_PATH,
  MUST_CHANGE_PASSWORD_MESSAGE,
  loginPath,
} from "@/server/auth/login-redirect";
import { resolveSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const resolved = await resolveSession();

  if (resolved.status === "unauthenticated") {
    redirect(loginPath());
  }

  if (resolved.status === "invalid") {
    redirect(loginPath("session_expired"));
  }

  if (!resolved.user.mustChangePassword) {
    redirect(APP_HOME_PATH);
  }

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
              Alterar senha
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              Defina uma senha pessoal antes de continuar.
            </Text>
          </Stack>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            <Alert.Root
              status="warning"
              variant="subtle"
              role="status"
              data-testid="must-change-password-alert"
            >
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  {MUST_CHANGE_PASSWORD_MESSAGE}
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
            <ChangePasswordForm />
          </Stack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
