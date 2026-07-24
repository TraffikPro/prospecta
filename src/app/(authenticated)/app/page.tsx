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
        Sessão ativa para {user.email}.
      </p>
      <ul className="space-y-2 text-sm">
        <li>
          <Link
            href="/app/intelligence"
            className="underline underline-offset-2 hover:text-neutral-950"
          >
            Inteligência
          </Link>
        </li>
        <li>
          <Link
            href="/app/leads"
            className="underline underline-offset-2 hover:text-neutral-950"
          >
            Leads
          </Link>
        </li>
        <li>
          <Link
            href="/app/pipeline"
            className="underline underline-offset-2 hover:text-neutral-950"
          >
            Pipeline
          </Link>
        </li>
        {user.role === "ADMIN" ? (
          <li>
            <Link
              href="/admin/users"
              className="underline underline-offset-2 hover:text-neutral-950"
            >
              Rota de prova ACL (ADMIN)
            </Link>
          </li>
        ) : null}
      </ul>
    </main>
  );
}
