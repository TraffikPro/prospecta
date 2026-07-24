import Link from "next/link";
import { redirect } from "next/navigation";
import { Heading, Link as ChakraLink, List, Stack, Text } from "@chakra-ui/react";

import { getSessionUser } from "@/server/auth/session";

export default async function AppHomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <Stack as="main" gap="4">
      <Heading as="h1" size="lg" fontWeight="semibold">
        Área autenticada
      </Heading>
      <Text fontSize="sm" color="fg.muted">
        Sessão ativa para {user.email}.
      </Text>
      <List.Root gap="2" fontSize="sm" variant="plain">
        <List.Item>
          <ChakraLink asChild textDecoration="underline">
            <Link href="/app/intelligence">Inteligência</Link>
          </ChakraLink>
        </List.Item>
        <List.Item>
          <ChakraLink asChild textDecoration="underline">
            <Link href="/app/leads">Leads</Link>
          </ChakraLink>
        </List.Item>
        <List.Item>
          <ChakraLink asChild textDecoration="underline">
            <Link href="/app/pipeline">Pipeline</Link>
          </ChakraLink>
        </List.Item>
        {user.role === "ADMIN" ? (
          <List.Item>
            <ChakraLink asChild textDecoration="underline">
              <Link href="/admin/users">Usuários (ADMIN)</Link>
            </ChakraLink>
          </List.Item>
        ) : null}
      </List.Root>
    </Stack>
  );
}
