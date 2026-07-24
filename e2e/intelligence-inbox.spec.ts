import { expect, test } from "@playwright/test";
import { createIntelligenceLead } from "./helpers/create-intelligence-lead";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("intelligence inbox", () => {
  test("lists prioritized opportunities and filters HIGH", async ({ page }) => {
    const stamp = Date.now();
    const highCompany = `Inbox HIGH ${stamp}`;
    const mediumCompany = `Inbox MEDIUM ${stamp}`;

    await createIntelligenceLead({
      companyName: highCompany,
      phone: `1388${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-inbox-high-${stamp}`,
      intelligence: {
        score: 92,
        qualification: "HIGH",
        signals: ["NO_WEBSITE", "HIGH_REVIEWS"],
        diagnostic: "Sem website com volume de avaliações.",
        pitch: "Abordagem HIGH de teste E2E.",
      },
    });

    await createIntelligenceLead({
      companyName: mediumCompany,
      phone: `1377${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-inbox-medium-${stamp}`,
      intelligence: {
        score: 58,
        qualification: "MEDIUM",
        signals: ["HIGH_RATING"],
        diagnostic: "Boa nota, prioridade média.",
        pitch: "Abordagem MEDIUM de teste E2E.",
      },
    });

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/intelligence");

    await expect(
      page.getByRole("heading", { name: "Oportunidades prioritárias" }),
    ).toBeVisible();
    await expect(page.getByTestId("intelligence-inbox-list")).toBeVisible();
    await expect(page.getByText(highCompany)).toBeVisible();
    await expect(page.getByText(mediumCompany)).toBeVisible();

    await page.getByRole("link", { name: "Alta", exact: true }).click();
    await page.waitForURL(/qualification=HIGH/);
    await expect(page.getByText(highCompany)).toBeVisible();
    await expect(page.getByText(mediumCompany)).toHaveCount(0);

    await page.getByText(highCompany).click();
    await page.waitForURL(new RegExp(`/app/leads/.+`));
    await expect(page.getByTestId("lead-intelligence-card")).toBeVisible();
  });
});
