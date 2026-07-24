import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetExpiresAt,
} from "../../src/server/auth/password-reset-token";

loadEnvConfig(process.cwd());

/** Creates a valid reset token for E2E without sending e-mail. */
export async function createPasswordResetTokenForEmail(
  email: string,
): Promise<string> {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, isActive: true },
    });
    if (!user?.isActive) {
      throw new Error(`Active user not found for ${email}`);
    }

    const plainToken = generatePasswordResetToken();
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashPasswordResetToken(plainToken),
        expiresAt: passwordResetExpiresAt(),
      },
    });
    return plainToken;
  } finally {
    await prisma.$disconnect();
  }
}
