import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

import { login } from "./helpers";
import { createPasswordResetTokenForEmail } from "./helpers/create-password-reset-token";
import { hashPassword } from "../src/server/auth/password";

loadEnvConfig(process.cwd());

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

async function restoreMemberPassword(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.user.update({
      where: { email: memberEmail.trim().toLowerCase() },
      data: { passwordHash: await hashPassword(memberPassword) },
    });
  } finally {
    await prisma.$disconnect();
  }
}

test.describe("password reset (Fatia 2)", () => {
  test.afterEach(async () => {
    await restoreMemberPassword();
  });

  test("forgot-password always acknowledges without revealing users", async ({
    page,
  }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("E-mail").fill("nobody@prospecta.test");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByTestId("forgot-password-ack")).toHaveText(
      "Se este email estiver cadastrado, enviaremos instruções.",
    );
  });

  test("reset token changes password and allows login", async ({ page }) => {
    const token = await createPasswordResetTokenForEmail(memberEmail);
    const nextPassword = `ResetE2E${Date.now()}!`;

    await page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    await page.getByLabel("Nova senha").fill(nextPassword);
    await page.getByLabel("Confirmar senha").fill(nextPassword);
    await page.getByRole("button", { name: "Alterar senha" }).click();

    await expect(page.getByTestId("password-reset-success")).toContainText(
      "Senha alterada. Faça login novamente.",
    );

    await login(page, memberEmail, nextPassword);
    await expect(
      page.getByRole("heading", { name: "Área autenticada" }),
    ).toBeVisible();
  });

  test("expired or bogus token is rejected", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");
    await page.getByLabel("Nova senha").fill("Something123!");
    await page.getByLabel("Confirmar senha").fill("Something123!");
    await page.getByRole("button", { name: "Alterar senha" }).click();
    await expect(page.getByText("Link inválido ou expirado.")).toBeVisible();
  });
});
