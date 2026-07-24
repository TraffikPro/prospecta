import { expect, test } from "@playwright/test";
import { createIntelligenceLead } from "./helpers/create-intelligence-lead";
import { LEAD_DETAIL_URL, login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";

test.describe("breadcrumb navigation v1", () => {
  test("MEMBER queue filter → lead breadcrumb → back preserves filter", async ({
    page,
  }) => {
    const stamp = Date.now();
    const company = `Clínica Breadcrumb E2E ${stamp}`;
    await createIntelligenceLead({
      companyName: company,
      phone: `1397${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-crumb-${stamp}`,
      intelligence: {
        score: 91,
        qualification: "HIGH",
        signals: ["NO_WEBSITE"],
        diagnostic: "Smoke breadcrumb",
        pitch: "Pitch breadcrumb E2E",
      },
    });

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads");
    await page.getByTestId("my-queue-filter-new").click();
    await expect(page).toHaveURL(/filter=new/);

    await page
      .getByTestId("my-queue-card")
      .filter({ hasText: company })
      .getByRole("link", { name: "Abrir lead" })
      .click();
    await page.waitForURL(LEAD_DETAIL_URL);
    await expect(page).toHaveURL(/from=my-leads/);
    await expect(page).toHaveURL(/filter=new/);

    await expect(page.getByTestId("app-breadcrumbs")).toBeVisible();
    await expect(page.getByTestId("breadcrumb-link")).toHaveText("Minha fila");
    await expect(page.getByTestId("breadcrumb-current")).toHaveText(company);

    await page.getByTestId("breadcrumb-link").click();
    await expect(page).toHaveURL(/\/app\/my-leads\?filter=new/);
  });

  test("intelligence and pipeline origins return correctly", async ({
    page,
  }) => {
    const stamp = Date.now();
    const company = `Empresa Origem E2E ${stamp}`;
    const lead = await createIntelligenceLead({
      companyName: company,
      phone: `1396${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-origin-${stamp}`,
      intelligence: {
        score: 80,
        qualification: "HIGH",
        signals: ["HIGH_RATING"],
        diagnostic: "Origem",
        pitch: "Pitch origem",
      },
    });

    await login(page, memberEmail, memberPassword);

    await page.goto("/app/intelligence");
    await page.getByRole("link", { name: company }).click();
    await page.waitForURL(LEAD_DETAIL_URL);
    await expect(page).toHaveURL(/from=intelligence/);
    await expect(page.getByTestId("breadcrumb-link")).toHaveText("Inteligência");
    await page.getByTestId("breadcrumb-link").click();
    await expect(page).toHaveURL(/\/app\/intelligence/);

    await page.goto(`/app/leads/${lead.id}?from=pipeline`);
    await expect(page.getByTestId("breadcrumb-link")).toHaveText("Pipeline");
    await page.getByTestId("breadcrumb-link").click();
    await expect(page).toHaveURL(/\/app\/pipeline/);
  });

  test("Leads → Novo lead breadcrumb back", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/leads/new");
    await expect(page.getByTestId("breadcrumb-link")).toHaveText("Leads");
    await expect(page.getByTestId("breadcrumb-current")).toHaveText("Novo lead");
    await page.getByTestId("breadcrumb-link").click();
    await expect(page).toHaveURL(/\/app\/leads$/);
  });

  test("ADMIN Mais → Usuários breadcrumb", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/admin/users");
    await expect(page.getByTestId("breadcrumb-link")).toHaveText("Mais");
    await expect(page.getByTestId("breadcrumb-current")).toHaveText("Usuários");
    await page.getByTestId("breadcrumb-link").click();
    await expect(page).toHaveURL(/\/app\/more/);
  });
});

test.describe("breadcrumb navigation mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("compact back without horizontal overflow", async ({ page }) => {
    const stamp = Date.now();
    const company = `Mobile Crumb ${stamp}`;
    await createIntelligenceLead({
      companyName: company,
      phone: `1395${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-mobile-crumb-${stamp}`,
      intelligence: {
        score: 77,
        qualification: "MEDIUM",
        signals: ["NO_WEBSITE"],
        diagnostic: "Mobile crumb",
        pitch: "Pitch mobile crumb",
      },
    });

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads?filter=new");
    await page
      .getByTestId("my-queue-card")
      .filter({ hasText: company })
      .getByRole("link", { name: "Abrir lead" })
      .click();
    await page.waitForURL(LEAD_DETAIL_URL);

    await expect(page.getByTestId("app-breadcrumbs")).toBeHidden();
    await expect(page.getByTestId("mobile-context-back")).toBeVisible();
    await expect(page.getByTestId("mobile-context-back")).toContainText(
      "Minha fila",
    );

    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(noOverflow).toBe(true);

    await page.getByTestId("mobile-context-back").click();
    await expect(page).toHaveURL(/\/app\/my-leads\?filter=new/);
  });
});
