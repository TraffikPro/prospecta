import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/auth/password";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetExpiresAt,
} from "@/server/auth/password-reset-token";
import type { EmailProvider } from "@/server/email/types";

const MIN_PASSWORD_LENGTH = 8;

export class PasswordResetError extends Error {
  readonly code:
    | "INVALID_TOKEN"
    | "WEAK_PASSWORD"
    | "PASSWORD_MISMATCH";

  constructor(
    code: PasswordResetError["code"],
    message: string,
  ) {
    super(message);
    this.name = "PasswordResetError";
    this.code = code;
  }
}

export type RequestPasswordResetDeps = {
  emailProvider?: EmailProvider;
  now?: Date;
};

function buildPasswordResetUrl(token: string): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_APP_URL is required");
  }
  const url = new URL("/reset-password", `${raw.replace(/\/$/, "")}/`);
  url.searchParams.set("token", token);
  return url.toString();
}

async function resolveEmailProvider(
  explicit?: EmailProvider,
): Promise<EmailProvider> {
  if (explicit) {
    return explicit;
  }
  const { createEmailProvider } = await import("@/server/email");
  return createEmailProvider();
}

/**
 * Always completes without revealing whether the email exists.
 * Side effects (token + email) only when an active user is found.
 */
export async function requestPasswordReset(
  emailRaw: string,
  deps: RequestPasswordResetDeps = {},
): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (!email) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return;
  }

  const plainToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(plainToken);
  const now = deps.now ?? new Date();
  const expiresAt = passwordResetExpiresAt(now);

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
    data: {
      usedAt: now,
    },
  });

  const created = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = buildPasswordResetUrl(plainToken);
  const emailProvider = await resolveEmailProvider(deps.emailProvider);

  try {
    await emailProvider.send({
      to: user.email,
      subject: "Recuperar acesso — Prospecta",
      text: [
        "Recebemos um pedido para redefinir sua senha no Prospecta.",
        "",
        `Abra o link (válido por 30 minutos): ${resetUrl}`,
        "",
        "Se você não pediu isso, ignore este e-mail.",
      ].join("\n"),
      html: [
        "<p>Recebemos um pedido para redefinir sua senha no Prospecta.</p>",
        `<p><a href="${resetUrl}">Redefinir senha</a></p>`,
        "<p>Este link é válido por 30 minutos.</p>",
        "<p>Se você não pediu isso, ignore este e-mail.</p>",
      ].join(""),
    });
  } catch (error) {
    await prisma.passwordResetToken.delete({ where: { id: created.id } });
    console.error("[password-reset] email send failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export type ResetPasswordInput = {
  token: string;
  password: string;
  confirmPassword: string;
};

export async function resetPasswordWithToken(
  input: ResetPasswordInput,
): Promise<void> {
  const token = input.token.trim();
  if (!token) {
    throw new PasswordResetError("INVALID_TOKEN", "Link inválido ou expirado.");
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new PasswordResetError(
      "WEAK_PASSWORD",
      `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }

  if (input.password !== input.confirmPassword) {
    throw new PasswordResetError(
      "PASSWORD_MISMATCH",
      "As senhas não coincidem.",
    );
  }

  const tokenHash = hashPasswordResetToken(token);
  const now = new Date();

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= now.getTime()) {
    throw new PasswordResetError("INVALID_TOKEN", "Link inválido ou expirado.");
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    });
    await tx.passwordResetToken.updateMany({
      where: {
        userId: record.userId,
        usedAt: null,
        id: { not: record.id },
      },
      data: { usedAt: now },
    });
    await tx.session.deleteMany({ where: { userId: record.userId } });
  });
}
