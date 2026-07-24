import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

/** Ensures seeded E2E users can authenticate (local DB may mark them inactive). */
export async function ensureActiveUser(email: string): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.user.update({
      where: { email: email.trim().toLowerCase() },
      data: { isActive: true },
    });
  } finally {
    await prisma.$disconnect();
  }
}
