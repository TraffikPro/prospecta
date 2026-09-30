import { expect, test } from "./test";
import { createIntelligenceLead } from "./helpers/create-intelligence-lead";
import { LEAD_DETAIL_URL, login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("mobile experience v1", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("member lands on Minha fila and completes contact flow", async ({
    page,
  }) => {
    const stamp = Date.now();
    const company = `Clínica Mobile E2E ${stamp}`;
    const phone = `1398${String(stamp).slice(-7)}`;
    const pitch = "Abordagem mobile E2E para odontologia.";

    await createIntelligenceLead({
      companyName: company,
      phone,
      ownerEmail: memberEmail,
      externalId: `e2e-mobile-${stamp}`,
      intelligence: {
        score: 99,
        qualification: "HIGH",
        signals: ["NO_WEBSITE", "HIGH_RATING"],
        diagnostic: "Boa reputação sem site — priorizar contato.",
        pitch,
      },
    });

    await login(page, memberEmail, memberPassword);
    await expect(page).toHaveURL(/\/app\/my-leads/);
    await expect(
      page.getByRole("heading", { name: "Minha fila", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("mobile-nav-my-leads")).toBeVisible();

    await page.goto("/app/my-leads?filter=new");
    await expect(page).toHaveURL(/filter=new/);
    await expect(page.getByText(company, { exact: true })).toBeVisible();

    const noHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(noHorizontalOverflow).toBe(true);

    // Avoid scroll/click through large filtered DOM — open by id (F9/F10 pattern).
    const leadId = await page
      .getByTestId("my-queue-row")
      .filter({ hasText: company })
      .getAttribute("data-lead-id");
    expect(leadId).toBeTruthy();
    await page.goto(`/app/leads/${leadId}?from=my-leads&filter=new`);
    await page.waitForURL(LEAD_DETAIL_URL);

    await expect(page.getByTestId("lead-intelligence-card")).toBeVisible();
    await page.getByTestId("intelligence-pitch-toggle").click();
    await expect(page.getByTestId("intelligence-pitch-text")).toContainText(
      pitch,
    );

    await page
      .getByTestId("lead-contact-actions")
      .getByRole("link", { name: "Registrar resultado" })
      .click();

    const form = page.locator("#register-activity");
    await expect(form).toBeVisible();
    await form.getByLabel("Tipo").selectOption("WHATSAPP");
    await form.getByLabel("Resultado").selectOption("SENT_NO_REPLY");
    await form.getByLabel("Descrição").fill("Contato mobile E2E sem resposta");
    await form.getByLabel(/Próximo passo/).fill("2026-08-15T10:00");
    await form.getByRole("button", { name: "Salvar atividade" }).click();

    await expect(
      page.getByRole("status").filter({ hasText: "Contato registrado" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("next-action-recommended")).toBeVisible();

    await page.getByRole("link", { name: "Voltar", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/my-leads\?filter=new/);
  });

  test("MEMBER reaches 403 via Mais when opening Admin", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.getByTestId("mobile-nav-more").click();
    await expect(page).toHaveURL(/\/app\/more/);
    await expect(page.getByRole("heading", { name: "Mais" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Equipe/i }),
    ).toHaveCount(0);

    const usersResponse = await page.goto("/admin/users");
    void usersResponse;
    await expect(page.getByText(/403|Acesso negado/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Equipe", exact: true }),
    ).toHaveCount(0);

    await page.goto("/admin/high-pool");
    await expect(page.getByText(/403|Acesso negado/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("pipeline accordion opens stage and lead", async ({ page }) => {
    const stamp = Date.now();
    const company = `Empresa Pipeline Mobile ${stamp}`;
    const email = `pipeline-mobile-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(company);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(LEAD_DETAIL_URL);

    await page.getByTestId("mobile-nav-pipeline").click();
    await expect(page).toHaveURL(/\/app\/pipeline/);
    await expect(page.getByTestId("pipeline-board")).toBeVisible();
    await expect(page.getByTestId("pipeline-stage-NEW")).toBeVisible();

    await page
      .getByTestId("pipeline-stage-NEW")
      .getByRole("link", { name: company, exact: true })
      .click();
    await page.waitForURL(LEAD_DETAIL_URL);

    await page.getByTestId("move-stage-select").selectOption("CONTACTED");
    await page.getByTestId("move-stage-submit").click();
    await expect(page.getByTestId("lead-stage")).toHaveAttribute(
      "data-stage",
      "CONTACTED",
      { timeout: 15_000 },
    );
    await expect(page.getByText("Mudança de etapa")).toBeVisible();
  });
});
