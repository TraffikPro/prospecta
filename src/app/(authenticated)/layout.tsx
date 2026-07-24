import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import {
  CHANGE_PASSWORD_PATH,
  loginPath,
} from "@/server/auth/login-redirect";
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

  if (user.mustChangePassword) {
    redirect(CHANGE_PASSWORD_PATH);
  }

  return (
    <AppShell userName={user.name} userRole={user.role}>
      {children}
    </AppShell>
  );
}
