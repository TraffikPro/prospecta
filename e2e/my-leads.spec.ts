import { expect, test } from "./test";
import { LEAD_DETAIL_URL, login } from "./helpers";

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
    await page.waitForURL(LEAD_DETAIL_URL);
    const leadId = page.url().split("/app/leads/")[1]?.split("?")[0];
    expect(leadId).toBeTruthy();

    await page.goto("/app/my-leads");
    await expect(
      page.getByRole("heading", { name: "Minha operação", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("my-queue-filters")).toBeVisible();
    await expect(page.getByText(company, { exact: true })).toBeVisible();
    await expect(
      page.getByText("Fazer primeiro contato").first(),
    ).toBeVisible();

    await page.goto("/app/my-leads?filter=new");
    await expect(page).toHaveURL(/filter=new/);
    await expect(page.getByText(company, { exact: true })).toBeVisible();

    await page.goto("/app/my-leads?filter=overdue");
    await expect(page).toHaveURL(/filter=overdue/);
    await expect(page.getByText(company, { exact: true })).toHaveCount(0);

    await page.goto("/app/my-leads?filter=new");
    await expect(page).toHaveURL(/filter=new/);
    const card = page.getByTestId("my-queue-card").filter({ hasText: company });
    await expect(card).toBeVisible();
    await expect(card.getByRole("link", { name: "Registrar", exact: true })).toBeVisible();
    // Abrir stays mobile-only; desktop opens via company name.
    await expect(card.getByRole("link", { name: "Abrir", exact: true })).toHaveCount(0);

    await page.goto(
      `/app/leads/${leadId}?from=my-leads&filter=new#register-activity`,
    );
    await page.waitForURL(LEAD_DETAIL_URL);
    await expect(page.locator("#register-activity")).toBeVisible();

    const form = page.locator("#register-activity");
    await form.getByLabel("Tipo").selectOption("WHATSAPP");
    await form.getByLabel("Resultado").selectOption("SENT_NO_REPLY");
    await form.getByLabel("Descrição").fill("Contato via Minha fila E2E");
    await form.getByLabel(/Próximo passo/).fill("2026-08-01T10:00");
    await form.getByRole("button", { name: "Salvar atividade" }).click();

    await expect(
      page.getByRole("status").filter({ hasText: "Contato registrado" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByLabel("Histórico").getByText("Contato via Minha fila E2E", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      form.getByRole("button", { name: "Salvar atividade" }),
    ).toHaveCount(0);
    await expect(page.getByTestId("activity-success-back")).toBeVisible();
    await expect(page.getByTestId("activity-success-back")).toHaveAttribute(
      "href",
      /\/app\/my-leads\?filter=new/,
    );

    await page.getByTestId("activity-register-another").click();
    await expect(
      form.getByRole("button", { name: "Salvar atividade" }),
    ).toBeVisible();
    await expect(form.getByLabel("Descrição")).toHaveValue("");
    await expect(form.getByLabel(/Próximo passo/)).toHaveValue("");

    await form
      .getByLabel("Descrição")
      .fill("Segundo contato via Minha fila E2E");
    await form.getByLabel(/Próximo passo/).fill("2026-08-02T10:00");
    await form.getByRole("button", { name: "Salvar atividade" }).click();
    await expect(page.getByTestId("activity-success-back")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByLabel("Histórico").getByText("Segundo contato via Minha fila E2E", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Histórico").getByText("Contato via Minha fila E2E", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
