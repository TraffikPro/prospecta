import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
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
    <AppShell userName={user.name} userRole={user.role}>
      {children}
    </AppShell>
  );
}
