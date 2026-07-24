import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("my leads queue", () => {
  test("member sees owned lead in Minha fila and opens detail", async ({
    page,
  }) => {
    const stamp = Date.now();
    const company = `Empresa Fila E2E ${stamp}`;
    const email = `fila-e2e-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);

    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(company);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(/\/app\/leads\/.+/);

    await page.goto("/app/my-leads");
    await expect(
      page.getByRole("heading", { name: "Minha operação", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("my-queue-summary")).toBeVisible();
    await expect(page.getByText(company, { exact: true })).toBeVisible();
    await expect(page.getByText("Fazer primeiro contato").first()).toBeVisible();

    await page
      .getByTestId("my-queue-card")
      .filter({ hasText: company })
      .getByRole("link", { name: "Abrir" })
      .click();
    await page.waitForURL(/\/app\/leads\/.+/);
    await expect(page.getByTestId("lead-next-action")).toBeVisible();
  });
});
