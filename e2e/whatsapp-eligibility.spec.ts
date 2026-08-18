import { expect, test } from "@playwright/test";
import { createIntelligenceLead } from "./helpers/create-intelligence-lead";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("WhatsApp contact eligibility", () => {
  test("keeps manual wa.me separate from authorized channel at UNKNOWN", async ({
    page,
  }) => {
    const stamp = Date.now();
    const companyName = `Clínica Elegibilidade ${stamp}`;
    const created = await createIntelligenceLead({
      companyName,
      phone: `1398${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-wa-elig-${stamp}`,
      intelligence: {
        score: 88,
        qualification: "HIGH",
        campaign: "santos-odontologia-2026-07",
        signals: ["NO_WEBSITE"],
      },
    });

    await login(page, memberEmail, memberPassword);
    await page.goto(`/app/leads/${created.id}`);

    await expect(page.getByTestId("lead-manual-contact-label")).toHaveText(
      "Contato manual (Sprint 0)",
    );
    await expect(page.getByTestId("lead-contact-actions").getByRole("link", { name: "Contatar" })).toBeVisible();

    const channel = page.getByTestId("whatsapp-authorized-channel");
    await expect(channel).toHaveAttribute("data-consent-status", "UNKNOWN");
    await expect(page.getByTestId("whatsapp-eligibility-status")).toHaveText(
      "Não verificada",
    );
    await expect(page.getByTestId("whatsapp-e164")).toHaveText("—");
    await expect(channel.getByText("Conversa: Não vinculada")).toBeVisible();
    await expect(channel.getByRole("button", { name: "Enviar" })).toHaveCount(0);
    await expect(
      page.getByText("Autorizado, mas envio pela API ainda indisponível"),
    ).toHaveCount(0);
  });
});
