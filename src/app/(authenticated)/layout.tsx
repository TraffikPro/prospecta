import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import {
  CHANGE_PASSWORD_PATH,
  loginPath,
} from "@/server/auth/login-redirect";
import { resolveSession } from "@/server/auth/session";
import {
  EMPTY_NAV_BADGES,
  getNavigationBadgesCached,
} from "@/server/navigation/get-navigation-badges";

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

  let badges = EMPTY_NAV_BADGES;
  try {
    badges = await getNavigationBadgesCached({ actorId: user.id });
  } catch {
    console.error("Failed to load navigation badges");
  }

  return (
    <AppShell
      userName={user.name}
      userRole={user.role}
      canRunAcquisition={user.canRunAcquisition}
      badges={badges}
    >
      {children}
    </AppShell>
  );
}
