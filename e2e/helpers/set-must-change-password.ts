import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

export async function setMustChangePassword(
  email: string,
  mustChangePassword: boolean,
): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.user.update({
      where: { email: email.trim().toLowerCase() },
      data: { mustChangePassword },
    });
  } finally {
    await prisma.$disconnect();
  }
}
