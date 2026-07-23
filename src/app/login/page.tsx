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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Prospecta</h1>
        <p className="text-sm text-neutral-600">
          Entre com sua conta do time fundador.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
