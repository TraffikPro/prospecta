import { redirect } from "next/navigation";
import { LogoutButton } from "@/features/auth/logout-button";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAuth } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();

  try {
    requireAuth(sessionUser);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  const user = sessionUser!;

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Prospecta</p>
            <p className="text-xs text-neutral-600">
              {user.name} · {user.role}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">{children}</div>
    </div>
  );
}
