import { expect, test } from "@playwright/test";

import { login } from "./helpers";
import { expireCurrentSession } from "./helpers/expire-current-session";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";

test.describe("auth recovery UI (Fatia 1)", () => {
  test("login still works and exposes forgot-password link", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("link", { name: "Esqueci minha senha" }),
    ).toBeVisible();

    await login(page, adminEmail, adminPassword);
    await expect(
      page.getByRole("heading", { name: "Área autenticada" }),
    ).toBeVisible();
  });

  test("forgot-password acknowledges without revealing whether email exists", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(
      page.getByRole("heading", { name: "Recuperar acesso" }),
    ).toBeVisible();

    await page.getByLabel("E-mail").fill("nobody@prospecta.test");
    await page.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByTestId("forgot-password-ack")).toHaveText(
      "Se este email estiver cadastrado, enviaremos instruções.",
    );
  });

  test("expired session redirects with session-expired message", async ({
    page,
  }) => {
    await login(page, adminEmail, adminPassword);
    await expireCurrentSession(page);

    // Already on /app after login — reload forces a protected request with the dead cookie.
    await page.reload();
    await expect(page).toHaveURL(/\/login\?reason=session_expired/);
    await expect(page.getByTestId("session-expired-alert")).toContainText(
      "Sua sessão expirou. Entre novamente para continuar.",
    );
  });

  test("anonymous visit to protected route does not claim session expired", async ({
    page,
  }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId("session-expired-alert")).toHaveCount(0);
  });
});
