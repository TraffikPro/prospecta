import { forbidden, redirect } from "next/navigation";
import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";

export default async function AdminAclProofPage() {
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

  return (
    <main className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight">ACL proof (ADMIN)</h1>
      <p className="text-sm text-neutral-600">
        Rota exclusiva de ADMIN para validar autorização server-side. Gestão de
        usuários fica fora desta fatia.
      </p>
    </main>
  );
}
