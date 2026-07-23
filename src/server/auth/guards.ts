import { AuthenticationError, AuthorizationError } from "./errors";
import type { SessionUser, UserRole } from "./types";

export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

export function requireRole(
  user: SessionUser | null,
  role: UserRole,
): SessionUser {
  const authenticated = requireAuth(user);
  if (authenticated.role !== role) {
    throw new AuthorizationError();
  }
  return authenticated;
}

export function requireAnyRole(
  user: SessionUser | null,
  roles: UserRole[],
): SessionUser {
  const authenticated = requireAuth(user);
  if (!roles.includes(authenticated.role)) {
    throw new AuthorizationError();
  }
  return authenticated;
}
