import { Alert, Heading, Stack, Text, Link as ChakraLink } from "@chakra-ui/react";
import NextLink from "next/link";
import { redirect } from "next/navigation";

import { PublicAuthShell } from "@/features/auth/components/public-auth-shell";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { postAuthPath } from "@/server/auth/login-redirect";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const user = await getSessionUser();
  if (user) {
    redirect(postAuthPath(user));
  }

  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <PublicAuthShell>
      <Stack gap="6">
        <Stack gap="1">
          <Heading as="h1" textStyle="pageTitle">
            Nova senha
          </Heading>
          <Text textStyle="meta">Defina uma nova senha para continuar.</Text>
        </Stack>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Stack gap="4">
            <Alert.Root status="error" variant="subtle" role="alert">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  Link inválido ou expirado.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
            <ChakraLink
              asChild
              fontSize="sm"
              fontWeight="medium"
              color="brand.fg"
              _hover={{ opacity: 0.8 }}
            >
              <NextLink href="/forgot-password">Solicitar novo link</NextLink>
            </ChakraLink>
          </Stack>
        )}
      </Stack>
    </PublicAuthShell>
  );
}
