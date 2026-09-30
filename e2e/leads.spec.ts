import { expect, test } from "./test";
import { LEAD_DETAIL_URL, login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("lead inventory", () => {
  test("member searches inventory and opens lead", async ({ page }) => {
    const stamp = Date.now();
    const company = `Empresa Inventario ${stamp}`;
    const email = `inv-e2e-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(company);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(LEAD_DETAIL_URL);

    await page.goto("/app/leads");
    await expect(page.getByRole("heading", { name: "Leads", exact: true })).toBeVisible();
    await expect(page.getByTestId("leads-inventory-toolbar")).toBeVisible();

    await page.getByLabel("Buscar leads").fill(company);
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page).toHaveURL(new RegExp(`q=`));
    await expect(page.getByRole("link", { name: company })).toBeVisible();

    await page.getByLabel("Buscar leads").fill(`zzzz-missing-${stamp}`);
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page.getByTestId("leads-no-results")).toBeVisible();
  });
});

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

    await page.waitForURL(LEAD_DETAIL_URL);
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
    await page.waitForURL(LEAD_DETAIL_URL);

    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(companyB);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();

    await expect(
      page.getByText("Já existe um lead com este e-mail ou telefone."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver lead existente" })).toBeVisible();
  });

  test("inventory pagination stays coherent with search", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/leads");
    await expect(page.getByTestId("leads-inventory-count")).toBeVisible();

    const countText = await page.getByTestId("leads-inventory-count").innerText();
    const totalMatch = countText.match(/(\d+)\s+leads/);
    const total = totalMatch ? Number(totalMatch[1]) : 0;
    test.skip(total <= 25, "needs >25 leads to exercise pagination");

    await expect(page.getByTestId("list-pagination")).toBeVisible();
    await page.getByTestId("list-pagination-next").click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId("list-pagination-status")).toContainText(
      "Página 2",
    );

    await page.goto("/app/leads?page=9999");
    await expect(page).not.toHaveURL(/page=9999/);
    await expect(page.getByTestId("list-pagination")).toBeVisible();
  });
});
