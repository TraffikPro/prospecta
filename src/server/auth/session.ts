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

function toSessionUser(user: {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
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

export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    return null;
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
        },
      },
    },
  });

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  if (isSessionExpired(session.expiresAt)) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    await clearSessionCookie();
    return null;
  }

  if (!session.user.isActive) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    await clearSessionCookie();
    return null;
  }

  return toSessionUser(session.user);
}
