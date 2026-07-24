import Link from "next/link";
import { Alert, Card, Heading, Stack, Text } from "@chakra-ui/react";

import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <Stack
      as="main"
      minH="100vh"
      align="center"
      justify="center"
      px="6"
      py="8"
      bg="bg.subtle"
    >
      <Card.Root variant="outline" borderRadius="card" maxW="md" w="full">
        <Card.Body>
          <Stack gap="5">
            <Alert.Root status="error" variant="subtle">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>403</Alert.Title>
                <Alert.Description>
                  Acesso negado
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            <Stack gap="2">
              <Heading as="h1" size="md" fontWeight="semibold">
                Acesso negado
              </Heading>
              <Text fontSize="sm" color="fg.muted">
                Você não possui permissão para esta área.
              </Text>
            </Stack>

            <Button asChild variant="outline" colorPalette="gray" width="fit-content">
              <Link href="/app">Voltar</Link>
            </Button>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
