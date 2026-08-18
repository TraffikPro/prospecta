import { expect, test } from "@playwright/test";
import { createIntelligenceLead } from "./helpers/create-intelligence-lead";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";

const BLOCKED_HOSTS = /devflow|facebook\.com|graph\.facebook|whatsapp\.com\/v\d|meta\.com/i;

function icpLead(stamp: number, ownerEmail: string) {
  return {
    companyName: `Clínica Elegibilidade ${stamp}`,
    phone: `1398${String(stamp).slice(-7)}`,
    ownerEmail,
    externalId: `e2e-wa-elig-${stamp}`,
    intelligence: {
      score: 88,
      qualification: "HIGH" as const,
      campaign: "santos-odontologia-2026-07",
      signals: ["NO_WEBSITE"],
    },
  };
}

test.describe("WhatsApp contact eligibility", () => {
  test.describe.configure({ timeout: 90_000 });

  test("anonymous is redirected away from lead detail", async ({ page }) => {
    const stamp = Date.now();
    const created = await createIntelligenceLead(icpLead(stamp, memberEmail));
    await page.goto(`/app/leads/${created.id}`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("keeps manual wa.me separate, blocks send, and records opt-in across refresh", async ({
    page,
  }) => {
    const outbound: string[] = [];
    page.on("request", (request) => {
      outbound.push(request.url());
    });

    const stamp = Date.now();
    const input = icpLead(stamp, memberEmail);
    const created = await createIntelligenceLead(input);

    await login(page, memberEmail, memberPassword);
    await page.goto(`/app/leads/${created.id}`);

    await expect(page.getByTestId("lead-manual-contact-label")).toHaveText(
      "Contato manual (Sprint 0)",
    );
    const contactLink = page
      .getByTestId("lead-contact-actions")
      .getByRole("link", { name: "Contatar" });
    await expect(contactLink).toBeVisible();

    const popupPromise = page.waitForEvent("popup");
    await contactLink.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/wa\.me|api\.whatsapp\.com/);
    await popup.close();

    const channel = page.getByTestId("whatsapp-authorized-channel");
    await expect(channel).toHaveAttribute("data-consent-status", "UNKNOWN");
    await expect(page.getByTestId("whatsapp-eligibility-status")).toHaveText(
      "Não verificada",
    );
    await expect(page.getByTestId("whatsapp-e164")).toHaveText("—");
    await expect(channel.getByRole("button", { name: "Enviar" })).toHaveCount(0);

    const optIn = page.getByTestId("whatsapp-opt-in-form");
    await optIn.locator('select[name="source"]').selectOption("PHONE_CALL");
    await optIn.locator('select[name="purpose"]').selectOption("PRESENTATION");
    const e164 = await optIn.locator('input[name="phoneE164"]').inputValue();
    expect(e164.startsWith("+55")).toBeTruthy();
    await optIn.getByRole("button", { name: "Registrar autorização" }).click();

    await expect(page.getByTestId("whatsapp-authorized-channel")).toHaveAttribute(
      "data-consent-status",
      "OPTED_IN",
    );
    await expect(page.getByTestId("whatsapp-api-unavailable")).toHaveText(
      "Autorizado, mas envio pela API ainda indisponível",
    );
    await expect(page.getByTestId("whatsapp-consent-event")).toHaveCount(1);

    await page.reload();
    await expect(page.getByTestId("whatsapp-authorized-channel")).toHaveAttribute(
      "data-consent-status",
      "OPTED_IN",
    );
    await expect(page.getByTestId("whatsapp-consent-event")).toHaveCount(1);
    await expect(page.getByTestId("whatsapp-consent-event")).toContainText(
      "Autorizado",
    );
    await expect(page.getByTestId("whatsapp-consent-event")).toContainText(
      "evidência",
    );
    await expect(page.getByTestId("whatsapp-consent-event")).toContainText(
      "registro",
    );

    expect(outbound.some((url) => BLOCKED_HOSTS.test(url))).toBeFalsy();
  });

  test("ADMIN can open a MEMBER lead eligibility section", async ({ page }) => {
    const stamp = Date.now() + 1;
    const created = await createIntelligenceLead(icpLead(stamp, memberEmail));
    await login(page, adminEmail, adminPassword);
    await page.goto(`/app/leads/${created.id}`);
    await expect(page.getByTestId("whatsapp-authorized-channel")).toBeVisible();
    await expect(page.getByTestId("whatsapp-eligibility-status")).toHaveText(
      "Não verificada",
    );
  });

  test("mobile viewport does not overflow horizontally", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const stamp = Date.now() + 2;
    const created = await createIntelligenceLead(icpLead(stamp, memberEmail));
    await login(page, memberEmail, memberPassword);
    await page.goto(`/app/leads/${created.id}`);
    await expect(page.getByTestId("whatsapp-authorized-channel")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
