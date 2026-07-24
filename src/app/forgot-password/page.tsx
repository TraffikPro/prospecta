import { Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { PublicAuthShell } from "@/features/auth/components/public-auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { postAuthPath } from "@/server/auth/login-redirect";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(postAuthPath(user));
  }

  return (
    <PublicAuthShell>
      <Stack gap="6">
        <Stack gap="1">
          <Heading as="h1" textStyle="pageTitle">
            Recuperar acesso
          </Heading>
          <Text textStyle="meta">
            Digite seu email e enviaremos instruções.
          </Text>
        </Stack>
        <ForgotPasswordForm />
      </Stack>
    </PublicAuthShell>
  );
}
