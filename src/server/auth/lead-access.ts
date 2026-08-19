import { AuthorizationError } from "@/server/auth/errors";
import type { SessionUser, UserRole } from "@/server/auth/types";

export type LeadOwnerRef = {
  ownerId: string;
};

export type ActorRef = {
  id: string;
  role: UserRole;
};

/** MEMBER may only touch own leads; ADMIN is global. */
export function assertCanAccessLead(
  lead: LeadOwnerRef,
  actor: ActorRef,
): void {
  if (actor.role === "MEMBER" && lead.ownerId !== actor.id) {
    throw new AuthorizationError();
  }
}

export function memberOwnsLead(
  lead: LeadOwnerRef,
  user: SessionUser,
): boolean {
  if (user.role !== "MEMBER") return true;
  return lead.ownerId === user.id;
}

/**
 * Duplicate match may belong to another owner.
 * Only ADMIN or the owner may receive the existing lead id.
 */
export function duplicateLeadIdForActor(
  duplicate: { id: string; ownerId: string },
  actor: ActorRef,
): string | undefined {
  if (actor.role === "ADMIN" || duplicate.ownerId === actor.id) {
    return duplicate.id;
  }
  return undefined;
}

export type LeadListScope =
  | { access: "all" }
  | { access: "owner"; ownerId: string };

/** MEMBER is owner-scoped. Global listing is an explicit ADMIN decision. */
export function leadListScopeForViewer(viewer: SessionUser): LeadListScope {
  if (viewer.role === "MEMBER") {
    return { access: "owner", ownerId: viewer.id };
  }
  return { access: "all" };
}
