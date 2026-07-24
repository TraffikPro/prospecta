import { expect, test } from "@playwright/test";

import { LEAD_DETAIL_URL, login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("chakra forms and data display v1", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("login PasswordInput toggles visibility", async ({ page }) => {
    await page.goto("/login");
    const password = page.getByLabel("Senha", { exact: true });
    await password.fill("secret-value");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Alternar visibilidade" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("secret-value");
  });

  test("lead detail uses DataList and Timeline", async ({ page }) => {
    const stamp = Date.now();
    const company = `Empresa Forms E2E ${stamp}`;
    const email = `forms-e2e-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(company);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(LEAD_DETAIL_URL);

    await expect(page.getByTestId("lead-info-list")).toBeVisible();
    await expect(page.getByTestId("lead-next-follow-up")).toBeVisible();

    await page.getByLabel("Tipo").selectOption("NOTE");
    await page.getByLabel("Descrição").fill("Nota Forms E2E");
    await page.getByRole("button", { name: "Salvar atividade" }).click();

    const timeline = page.getByTestId("activity-timeline");
    await expect(timeline).toBeVisible({ timeout: 10_000 });
    await expect(timeline.getByText("Nota Forms E2E")).toBeVisible();
    await expect(
      timeline.getByRole("listitem").filter({ hasText: "Nota" }).first(),
    ).toBeVisible();
  });
});
