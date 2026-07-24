import { expect, test } from "@playwright/test";
import { createIntelligenceLead } from "./helpers/create-intelligence-lead";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("lead intelligence view", () => {
  test("member sees intelligence card and can copy pitch", async ({ page }) => {
    const stamp = Date.now();
    const company = `Clínica E2E Intel ${stamp}`;
    const phone = `1399${String(stamp).slice(-7)}`;
    const pitch =
      "Olá, encontrei a clínica de vocês no Google e vi a ótima reputação local.";
    const diagnostic =
      "Empresa com boa reputação e sem website — oportunidade clara.";

    const lead = await createIntelligenceLead({
      companyName: company,
      phone,
      ownerEmail: memberEmail,
      externalId: `e2e-intel-${stamp}`,
      intelligence: {
        score: 90,
        qualification: "HIGH",
        signals: ["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"],
        diagnostic,
        pitch,
      },
    });

    await login(page, memberEmail, memberPassword);
    await page.goto(`/app/leads/${lead.id}`);

    await expect(page.getByRole("heading", { name: company })).toBeVisible();
    await expect(page.getByTestId("lead-source")).toHaveText("GOOGLE_PLACES");
    await expect(page.getByTestId("lead-intelligence-card")).toBeVisible();
    await expect(page.getByTestId("intelligence-score")).toContainText("90");
    await expect(page.getByTestId("intelligence-qualification")).toHaveText(
      "HIGH",
    );
    await expect(page.getByTestId("intelligence-signals")).toContainText(
      "Sem website identificado",
    );
    await expect(page.getByTestId("intelligence-diagnostic")).toContainText(
      diagnostic,
    );
    await expect(page.getByTestId("intelligence-pitch-text")).toHaveText(pitch);

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByTestId("intelligence-pitch-copy").click();
    await expect(page.getByTestId("intelligence-pitch-copy")).toContainText(
      /Copiado|Copiar abordagem/,
    );

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe(pitch);
  });
});
