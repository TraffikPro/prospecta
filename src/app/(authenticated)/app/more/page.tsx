import Link from "next/link";
import { redirect } from "next/navigation";
import { Heading, Link as ChakraLink, Stack, Text } from "@chakra-ui/react";

import { LogoutButton } from "@/features/auth/logout-button";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";

export default async function MorePage() {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const user = sessionUser!;

  return (
    <Stack as="main" gap="6">
      <Stack gap="1">
        <Heading as="h1" size="lg" fontWeight="semibold">
          Mais
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          {user.name} · {user.role}
        </Text>
      </Stack>

      <Stack gap="3" fontSize="md">
        <ChakraLink asChild textDecoration="underline" minH="11" display="flex" alignItems="center">
          <Link href="/app/leads">Lista de leads</Link>
        </ChakraLink>
        <ChakraLink asChild textDecoration="underline" minH="11" display="flex" alignItems="center">
          <Link href="/app">Área autenticada</Link>
        </ChakraLink>
        {user.role === "ADMIN" ? (
          <ChakraLink asChild textDecoration="underline" minH="11" display="flex" alignItems="center">
            <Link href="/admin/users">Usuários (ADMIN)</Link>
          </ChakraLink>
        ) : null}
      </Stack>

      <LogoutButton />
    </Stack>
  );
}
