import { Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/app");
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
              Recuperar acesso
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              Digite seu email e enviaremos instruções.
            </Text>
          </Stack>
        </Card.Header>
        <Card.Body>
          <ForgotPasswordForm />
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
