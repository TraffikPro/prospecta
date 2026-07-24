import { Alert, Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import {
  isSessionExpiredReason,
  postAuthPath,
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
    redirect(postAuthPath(user));
  }

  const params = await searchParams;
  const showSessionExpired = isSessionExpiredReason(params.reason);

  return (
    <AuthShell>
      <Stack gap="6">
        <Stack gap="1">
          <Heading as="h1" textStyle="pageTitle">
            Bem-vindo de volta
          </Heading>
          <Text textStyle="meta">Entre com sua conta para continuar.</Text>
        </Stack>

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
    </AuthShell>
  );
}
