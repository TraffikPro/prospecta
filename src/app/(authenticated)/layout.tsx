import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { loginPath } from "@/server/auth/login-redirect";
import { resolveSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const resolved = await resolveSession();

  if (resolved.status === "unauthenticated") {
    redirect(loginPath());
  }

  if (resolved.status === "invalid") {
    redirect(loginPath("session_expired"));
  }

  const user = resolved.user;

  return (
    <AppShell userName={user.name} userRole={user.role}>
      {children}
    </AppShell>
  );
}
