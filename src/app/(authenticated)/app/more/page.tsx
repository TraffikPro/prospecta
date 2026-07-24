import Link from "next/link";
import { redirect } from "next/navigation";
import { Link as ChakraLink, Stack } from "@chakra-ui/react";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { roleLabels } from "@/features/admin/role.labels";
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
    <PageFrame width="list" gap="6">
      <ContextualNav items={[{ label: "Mais" }]} />
      <PageHeading
        title="Mais"
        meta={`${user.name} · ${roleLabels[user.role]}`}
      />

      <Stack gap="3" fontSize="md">
        <ChakraLink
          asChild
          textDecoration="underline"
          minH="touch"
          display="flex"
          alignItems="center"
        >
          <Link href="/app/leads">Lista de leads</Link>
        </ChakraLink>
        <ChakraLink
          asChild
          textDecoration="underline"
          minH="touch"
          display="flex"
          alignItems="center"
        >
          <Link href="/app">Início</Link>
        </ChakraLink>
        {user.role === "ADMIN" ? (
          <ChakraLink
            asChild
            textDecoration="underline"
            minH="touch"
            display="flex"
            alignItems="center"
          >
            <Link href="/admin/users">Usuários</Link>
          </ChakraLink>
        ) : null}
      </Stack>

      <LogoutButton />
    </PageFrame>
  );
}
