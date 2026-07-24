import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";
const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("auth + ACL", () => {
  test("anonymous user is redirected to login", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login sets HttpOnly session cookie and reaches /app", async ({
    page,
    context,
  }) => {
    await login(page, adminEmail, adminPassword);
    await expect(page.getByRole("heading", { name: /^Olá,/ })).toBeVisible();

    const cookies = await context.cookies();
    const sessionCookie = cookies.find(
      (cookie) =>
        cookie.name === "prospecta_session" ||
        cookie.name === "__Secure-prospecta_session",
    );
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);
  });

  test("logout clears session and returns to login", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
  });

  test("MEMBER receives 403 on ADMIN ACL proof route", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    const response = await page.goto("/admin/users");
    expect(response?.status()).toBe(403);
    await expect(
      page.getByText(/403|Acesso negado|não possui permissão/i).first(),
    ).toBeVisible();
  });

  test("ADMIN can open users list", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: "Usuários", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("admin-users")).toBeVisible();
  });

  test("invalid credentials do not reveal whether email exists", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("nobody@prospecta.test");
    await page.getByLabel("Senha").fill("wrong-password");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Credenciais inválidas.")).toBeVisible();
  });
});
