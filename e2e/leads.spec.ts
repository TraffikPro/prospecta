import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("lead foundation", () => {
  test("member creates lead and sees detail", async ({ page }) => {
    const stamp = Date.now();
    const company = `Empresa E2E ${stamp}`;
    const email = `e2e-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/leads");
    await page.getByRole("link", { name: "+ Novo Lead" }).click();
    await page.waitForURL("**/app/leads/new");

    await page.getByLabel("Empresa").fill(company);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();

    await page.waitForURL(/\/app\/leads\/.+/);
    await expect(page.getByRole("heading", { name: company })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByTestId("lead-stage")).toHaveAttribute(
      "data-stage",
      "NEW",
    );
  });

  test("duplicate email shows DUPLICATE_LEAD error", async ({ page }) => {
    const stamp = Date.now();
    const companyA = `Empresa Dup A ${stamp}`;
    const companyB = `Empresa Dup B ${stamp}`;
    const email = `dup-e2e-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);

    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(companyA);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(/\/app\/leads\/.+/);

    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(companyB);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();

    await expect(
      page.getByText("Já existe um lead com este e-mail ou telefone."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver lead existente" })).toBeVisible();
  });
});
