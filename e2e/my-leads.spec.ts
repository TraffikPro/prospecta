import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("my leads queue", () => {
  test("member filters queue and registers activity from card CTA", async ({
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
    await expect(page.getByTestId("my-queue-filters")).toBeVisible();
    await expect(page.getByText(company, { exact: true })).toBeVisible();
    await expect(
      page.getByText("Fazer primeiro contato").first(),
    ).toBeVisible();

    await page.getByTestId("my-queue-filter-new").click();
    await expect(page).toHaveURL(/filter=new/);
    await expect(page.getByText(company, { exact: true })).toBeVisible();

    await page.getByTestId("my-queue-filter-overdue").click();
    await expect(page).toHaveURL(/filter=overdue/);
    await expect(page.getByText(company, { exact: true })).toHaveCount(0);

    await page.getByTestId("my-queue-filter-new").click();
    await page
      .getByTestId("my-queue-card")
      .filter({ hasText: company })
      .getByRole("link", { name: "Registrar contato" })
      .click();

    await page.waitForURL(/\/app\/leads\/.+/);
    await expect(page.locator("#register-activity")).toBeVisible();

    const form = page.locator("#register-activity");
    await form.getByLabel("Tipo").selectOption("WHATSAPP");
    await form.getByLabel("Resultado").selectOption("SENT_NO_REPLY");
    await form.getByLabel("Descrição").fill("Contato via Minha fila E2E");
    await form.getByLabel(/Próximo passo/).fill("2026-08-01T10:00");
    await form.getByRole("button", { name: "Salvar atividade" }).click();

    await expect(page.getByText("Atividade registrada.")).toBeVisible();
    await expect(page.getByText("Contato via Minha fila E2E")).toBeVisible();
  });
});
