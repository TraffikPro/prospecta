import { redirect } from "next/navigation";
import { CreateLeadForm } from "@/features/leads/create-lead-form";
import { AuthenticationError } from "@/server/auth/errors";
import { requireAnyRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";

export default async function NewLeadPage() {
  const sessionUser = await getSessionUser();
  try {
    requireAnyRole(sessionUser, ["ADMIN", "MEMBER"]);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <main className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Novo lead</h1>
      <CreateLeadForm />
    </main>
  );
}
