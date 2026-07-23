import "server-only";

import { cookies } from "next/headers";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getSessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-prospecta_session"
    : "prospecta_session";
}

export function getSessionTtlMs(): number {
  return SESSION_TTL_MS;
}

export async function setSessionCookie(
  sessionId: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(getSessionCookieName(), sessionId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function readSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(getSessionCookieName())?.value;
}
