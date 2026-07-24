import { Alert, Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { redirect } from "next/navigation";

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
              Nova senha
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              Defina uma nova senha para continuar.
            </Text>
          </Stack>
        </Card.Header>
        <Card.Body>
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
              <Text fontSize="sm">
                <NextLink href="/forgot-password">
                  Solicitar novo link
                </NextLink>
              </Text>
            </Stack>
          )}
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
