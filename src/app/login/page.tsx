import { Box, Card, Heading, Stack, Text } from "@chakra-ui/react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
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
              Prospecta
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              Entre com sua conta do time fundador.
            </Text>
          </Stack>
        </Card.Header>
        <Card.Body>
          <LoginForm />
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
