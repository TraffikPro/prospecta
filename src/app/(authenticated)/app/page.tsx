import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";

export default async function AppHomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Área autenticada</h1>
      <p className="text-sm text-neutral-600">
        Sessão ativa para {user.email}. O fluxo vertical de leads vem na próxima
        fatia.
      </p>
      {user.role === "ADMIN" ? (
        <p className="text-sm">
          <Link
            href="/admin/users"
            className="underline underline-offset-2 hover:text-neutral-950"
          >
            Rota de prova ACL (ADMIN)
          </Link>
        </p>
      ) : null}
    </main>
  );
}
