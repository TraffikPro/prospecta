import { expect, test } from "@playwright/test";

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

test.describe("first access visual consistency (Fatia B)", () => {
  test.afterEach(async () => {
    await restoreMember();
  });

  test("desktop task shell: compact brand, no public split, logout kept", async ({
    page,
  }) => {
    await setMustChangePassword(memberEmail, true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    await page.getByLabel("E-mail", { exact: true }).fill(memberEmail);
    await page.getByLabel("Senha", { exact: true }).fill(memberPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/change-password/);

    await expect(page.getByTestId("task-auth-shell")).toBeVisible();
    await expect(page.getByTestId("task-auth-brand")).toBeVisible();
    await expect(page.getByTestId("public-auth-brand-panel")).toHaveCount(0);
    await expect(page.getByTestId("login-brand-panel")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Alterar senha", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("must-change-password-alert")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
    await expect(
      page.getByText("Acesse novamente sua operação."),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Alterar senha" })).toBeInViewport();
  });

  test("mobile: single wordmark, CTA in fold, no overflow", async ({
    page,
  }) => {
    await setMustChangePassword(memberEmail, true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await page.getByLabel("E-mail", { exact: true }).fill(memberEmail);
    await page.getByLabel("Senha", { exact: true }).fill(memberPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/change-password/);

    await expect(
      page.locator('[data-testid="prospecta-wordmark"]:visible'),
    ).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Alterar senha" })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
