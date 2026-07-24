import { forbidden, redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
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
    <PageFrame width="list" gap="6">
      <ContextualNav
        items={[
          { label: "Mais", href: "/app/more" },
          { label: "Usuários" },
        ]}
      />
      <PageHeading
        title="Usuários"
        meta="Visão administrativa somente leitura."
      />

      <UsersTable users={users} />
    </PageFrame>
  );
}
