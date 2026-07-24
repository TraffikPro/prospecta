import { expect, test } from "@playwright/test";

import { login } from "./helpers";
import { expireCurrentSession } from "./helpers/expire-current-session";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";

test.describe("login visual refresh", () => {
  test("desktop shows brand panel and form hierarchy", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");

    await expect(page.getByTestId("login-brand-panel")).toBeVisible();
    await expect(page.getByTestId("login-mobile-brand-bar")).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Bem-vindo de volta", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Transforme oportunidades em próximas ações."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeInViewport();
    await expect(
      page.getByRole("link", { name: "Esqueci minha senha" }),
    ).toBeVisible();
  });

  test("mobile shows top bar once, no brand panel, no overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    await expect(page.getByTestId("login-brand-panel")).toBeHidden();
    await expect(page.getByTestId("login-mobile-brand-bar")).toBeVisible();
    // Brand panel stays in the DOM (display:none); only one wordmark must be visible.
    await expect(
      page.locator('[data-testid="prospecta-wordmark"]:visible'),
    ).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Bem-vindo de volta", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeInViewport();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test("auth states and redirects still work after visual refresh", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");

    await page.getByLabel("E-mail", { exact: true }).fill("nobody@prospecta.test");
    await page.getByLabel("Senha", { exact: true }).fill("WrongPassword1!");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert")).toBeVisible();

    await login(page, adminEmail, adminPassword);
    await expireCurrentSession(page);
    await page.reload();
    await expect(page).toHaveURL(/\/login\?reason=session_expired/);
    await expect(page.getByTestId("session-expired-alert")).toContainText(
      "Sua sessão expirou. Entre novamente para continuar.",
    );
  });
});
