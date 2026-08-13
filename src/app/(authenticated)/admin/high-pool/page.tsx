import { forbidden, redirect } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import { PageHeading } from "@/components/layout/page-heading";
import { ContextualNav } from "@/components/navigation";
import { HighPoolReviewBoard } from "@/features/portfolio/components/high-pool-review";
import { AuthenticationError, AuthorizationError } from "@/server/auth/errors";
import { requireRole } from "@/server/auth/guards";
import { getSessionUser } from "@/server/auth/session";
import { listHighPoolReview } from "@/server/services/portfolio.service";

export default async function AdminHighPoolPage() {
  const sessionUser = await getSessionUser();

  try {
    requireRole(sessionUser, "ADMIN");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    if (error instanceof AuthorizationError) {
      forbidden();
    }
    throw error;
  }

  const review = await listHighPoolReview(sessionUser!.id);

  return (
    <PageFrame width="list" gap="6">
      <ContextualNav
        items={[
          { label: "Mais", href: "/app/more" },
          { label: "Revisão HIGH" },
        ]}
      />
      <PageHeading
        title="Revisão HIGH"
        meta="Pool de HIGH, reciclagem explícita e limite de 2 ciclos comerciais."
      />
      <HighPoolReviewBoard review={review} />
    </PageFrame>
  );
}
