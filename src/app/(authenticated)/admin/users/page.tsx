import { forbidden, redirect } from "next/navigation";
import { Heading, Stack, Text } from "@chakra-ui/react";

import { ContextualNav } from "@/components/navigation";
import { UsersTable } from "@/features/admin/components/users-table";
import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { getAdminUsers } from "@/server/services/user.service";

export default async function AdminUsersPage() {
  const sessionUser = await getSessionUser();

  try {
    requireRole(sessionUser, "ADMIN");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    if (error instanceof AuthorizationError) {
      forbidden();
    }
    throw error;
  }

  const users = await getAdminUsers();

  return (
    <Stack as="main" gap="6">
      <ContextualNav
        items={[
          { label: "Mais", href: "/app/more" },
          { label: "Usuários" },
        ]}
      />
      <Stack gap="1">
        <Heading as="h1" size="lg" fontWeight="semibold">
          Usuários
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          Visão administrativa somente leitura. Sem CRUD nesta fatia.
        </Text>
      </Stack>

      <UsersTable users={users} />
    </Stack>
  );
}
