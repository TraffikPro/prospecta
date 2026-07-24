import { redirect } from "next/navigation";
import { loginPath, postAuthPath } from "@/server/auth/login-redirect";
import { getSessionUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  redirect(user ? postAuthPath(user) : loginPath());
}
