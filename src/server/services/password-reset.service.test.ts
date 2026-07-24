import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetExpiresAt,
} from "@/server/auth/password-reset-token";
import { MemoryEmailAdapter } from "@/server/email/memory-adapter";
import {
  PasswordResetError,
  requestPasswordReset,
  resetPasswordWithToken,
} from "./password-reset.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe("password reset service", { skip: !hasDatabase }, () => {
  const suffix = Date.now().toString(36);
  const email = `reset-${suffix}@prospecta.test`;
  let userId = "";
  const mail = new MemoryEmailAdapter();

  before(async () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3000";
    const user = await prisma.user.create({
      data: {
        email,
        name: "Reset Test",
        role: "MEMBER",
        passwordHash: await hashPassword("OldPassword123!"),
        isActive: true,
        mustChangePassword: true,
      },
    });
    userId = user.id;
  });

  after(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("does not reveal missing users and sends nothing", async () => {
    mail.clear();
    await requestPasswordReset("missing@prospecta.test", {
      emailProvider: mail,
    });
    assert.equal(mail.sent.length, 0);
  });

  it("creates hashed token, emails link, and resets password once", async () => {
    mail.clear();
    await requestPasswordReset(email, { emailProvider: mail });
    assert.equal(mail.sent.length, 1);

    const match = mail.sent[0]?.text.match(/token=([A-Za-z0-9_-]+)/);
    assert.ok(match?.[1]);
    const plainToken = match[1];

    const stored = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashPasswordResetToken(plainToken) },
    });
    assert.ok(stored);
    assert.equal(stored.usedAt, null);

    await prisma.session.create({
      data: {
        userId,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await resetPasswordWithToken({
      token: plainToken,
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    assert.equal(await verifyPassword("NewPassword123!", user.passwordHash), true);
    assert.equal(await verifyPassword("OldPassword123!", user.passwordHash), false);
    assert.equal(user.mustChangePassword, false);

    const sessions = await prisma.session.count({ where: { userId } });
    assert.equal(sessions, 0);

    const used = await prisma.passwordResetToken.findUniqueOrThrow({
      where: { id: stored.id },
    });
    assert.ok(used.usedAt);

    await assert.rejects(
      () =>
        resetPasswordWithToken({
          token: plainToken,
          password: "AnotherPass123!",
          confirmPassword: "AnotherPass123!",
        }),
      (error: unknown) =>
        error instanceof PasswordResetError && error.code === "INVALID_TOKEN",
    );
  });

  it("rejects expired tokens", async () => {
    const plainToken = generatePasswordResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashPasswordResetToken(plainToken),
        expiresAt: new Date(Date.now() - 1_000),
      },
    });

    await assert.rejects(
      () =>
        resetPasswordWithToken({
          token: plainToken,
          password: "FreshPass123!",
          confirmPassword: "FreshPass123!",
        }),
      (error: unknown) =>
        error instanceof PasswordResetError && error.code === "INVALID_TOKEN",
    );
  });

  it("rejects password mismatch", async () => {
    const plainToken = generatePasswordResetToken();
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashPasswordResetToken(plainToken),
        expiresAt: passwordResetExpiresAt(),
      },
    });

    await assert.rejects(
      () =>
        resetPasswordWithToken({
          token: plainToken,
          password: "FreshPass123!",
          confirmPassword: "Different123!",
        }),
      (error: unknown) =>
        error instanceof PasswordResetError && error.code === "PASSWORD_MISMATCH",
    );
  });
});
