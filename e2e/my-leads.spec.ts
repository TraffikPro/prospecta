import { expect, test } from "./test";
import { LEAD_DETAIL_URL, login } from "./helpers";
import { createIntelligenceLead } from "./helpers/create-intelligence-lead";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("my leads queue", () => {
  test("member filters queue and registers activity from card CTA", async ({
    page,
  }) => {
    const stamp = Date.now();
    const company = `Empresa Fila E2E ${stamp}`;
    const lead = await createIntelligenceLead({
      companyName: company,
      phone: `1381${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-fila-${stamp}`,
      intelligence: {
        score: 99,
        qualification: "HIGH",
        signals: ["NO_WEBSITE"],
        diagnostic: "Fila E2E",
        pitch: "Pitch fila E2E",
      },
    });

    await login(page, memberEmail, memberPassword);

    await page.goto("/app/my-leads");
    await expect(
      page.getByRole("heading", { name: "Minha fila", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("my-queue-filters")).toBeVisible();
    await expect(
      page.getByText("Fazer primeiro contato").first(),
    ).toBeVisible();

    // High-score no-contact lead is in the bounded "all" projection; filter
    // views paginate the full bucket with truthful counts.
    await page.goto("/app/my-leads?filter=new");
    await expect(page).toHaveURL(/filter=new/);
    await expect(page.getByText(company, { exact: true })).toBeVisible();

    await page.goto("/app/my-leads?filter=overdue");
    await expect(page).toHaveURL(/filter=overdue/);
    await expect(page.getByText(company, { exact: true })).toHaveCount(0);

    await page.goto(
      `/app/leads/${lead.id}?from=my-leads&filter=new#register-activity`,
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
      page.getByLabel("Histórico").getByText("Contato via Minha fila E2E"),
    ).toBeVisible();
  });
});
