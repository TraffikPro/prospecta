import { expect, test } from "@playwright/test";

import { login } from "./helpers";
import { setMustChangePassword } from "./helpers/set-must-change-password";
import { hashPassword } from "../src/server/auth/password";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

async function restoreMember(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.user.update({
      where: { email: memberEmail.trim().toLowerCase() },
      data: {
        mustChangePassword: false,
        passwordHash: await hashPassword(memberPassword),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

test.describe("must change password (Fatia 3)", () => {
  test.afterEach(async () => {
    await restoreMember();
  });

  test("first login forces password change before app access", async ({
    page,
  }) => {
    await setMustChangePassword(memberEmail, true);

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(memberEmail);
    await page.getByLabel("Senha").fill(memberPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/change-password/);
    await expect(page.getByTestId("must-change-password-alert")).toContainText(
      "Você precisa alterar sua senha para continuar.",
    );

    await page.goto("/app");
    await expect(page).toHaveURL(/\/change-password/);

    const nextPassword = `FirstAccess${Date.now()}!`;
    await page.getByLabel("Senha atual").fill(memberPassword);
    await page.getByLabel("Nova senha", { exact: true }).fill(nextPassword);
    await page.getByLabel("Confirmar nova senha").fill(nextPassword);
    await page.getByRole("button", { name: "Alterar senha" }).click();

    await expect(page).toHaveURL(/\/app\/my-leads/);
    await expect(
      page.getByRole("heading", { name: "Minha operação", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sair" }).click();
    await login(page, memberEmail, nextPassword);
    await expect(page).toHaveURL(/\/app\/my-leads/);
  });
});

