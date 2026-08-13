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
