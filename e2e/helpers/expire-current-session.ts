import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import type { Page } from "@playwright/test";

loadEnvConfig(process.cwd());

/** Deletes the DB session row while leaving the browser cookie in place. */
export async function expireCurrentSession(page: Page): Promise<void> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(
    (cookie) =>
      cookie.name === "prospecta_session" ||
      cookie.name === "__Secure-prospecta_session",
  );

  if (!sessionCookie?.value) {
    throw new Error("No session cookie found to expire");
  }

  const prisma = new PrismaClient();
  try {
    const result = await prisma.session.deleteMany({
      where: { id: sessionCookie.value },
    });
    if (result.count === 0) {
      throw new Error(
        `Session row not found for cookie id=${sessionCookie.value}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}
