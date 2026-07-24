import "server-only";

import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  getSessionTtlMs,
  readSessionCookie,
  setSessionCookie,
} from "./cookies";
import { isSessionExpired } from "./session-expiry";
import type { SessionUser } from "./types";

export { isSessionExpired } from "./session-expiry";

export type ResolvedSession =
  | { status: "authenticated"; user: SessionUser }
  | { status: "unauthenticated" }
  | { status: "invalid" };

function toSessionUser(user: {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  mustChangePassword: boolean;
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + getSessionTtlMs());
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });
  await setSessionCookie(session.id, expiresAt);
  return session.id;
}

export async function destroySession(): Promise<void> {
  const sessionId = await readSessionCookie();
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  await clearSessionCookie();
}

/**
 * Resolves the current session for Server Components / layouts.
 * Does not mutate cookies here — Next.js only allows cookie writes in
 * Server Actions or Route Handlers. Dead cookies are overwritten on login
 * or cleared by logout (`destroySession`).
 */
export async function resolveSession(): Promise<ResolvedSession> {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    return { status: "unauthenticated" };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
        },
      },
    },
  });

  if (!session) {
    return { status: "invalid" };
  }

  if (isSessionExpired(session.expiresAt)) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return { status: "invalid" };
  }

  if (!session.user.isActive) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return { status: "invalid" };
  }

  return {
    status: "authenticated",
    user: toSessionUser(session.user),
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const resolved = await resolveSession();
  return resolved.status === "authenticated" ? resolved.user : null;
}
