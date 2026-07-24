import { Alert, Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { TaskAuthShell } from "@/features/auth/components/task-auth-shell";
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
    <TaskAuthShell>
      <Stack gap="6">
        <Stack gap="1">
          <Heading as="h1" textStyle="pageTitle">
            Alterar senha
          </Heading>
          <Text textStyle="meta">
            Defina uma senha pessoal antes de continuar.
          </Text>
        </Stack>

        <Alert.Root
          status="warning"
          variant="subtle"
          role="status"
          data-testid="must-change-password-alert"
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{MUST_CHANGE_PASSWORD_MESSAGE}</Alert.Description>
          </Alert.Content>
        </Alert.Root>

        <ChangePasswordForm />
      </Stack>
    </TaskAuthShell>
  );
}
