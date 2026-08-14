import { expect, test } from "@playwright/test";
import { createIntelligenceLead } from "./helpers/create-intelligence-lead";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";

function icpLead(stamp: number, ownerEmail: string) {
  return {
    companyName: `Clínica Playbook ${stamp}`,
    phone: `1397${String(stamp).slice(-7)}`,
    ownerEmail,
    externalId: `e2e-playbook-${stamp}`,
    contactName: "Marina",
    intelligence: {
      score: 92,
      qualification: "HIGH" as const,
      campaign: "santos-odontologia-2026-07",
      signals: ["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"],
      rating: 4.8,
      reviews: 186,
      diagnostic: "Reputação alta sem site informado.",
      pitch: "Pitch gerado — o playbook não deve copiar isto.",
    },
  };
}

test.describe("commercial playbook UI", () => {
  test.describe.configure({ timeout: 90_000 });

  test("member copies approved D0 then D+2 and registers via existing activity", async ({
    page,
  }) => {
    const stamp = Date.now();
    const input = icpLead(stamp, memberEmail);
    const created = await createIntelligenceLead(input);

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads");
    await expect(page.getByText(input.companyName, { exact: true })).toBeVisible();
    await page.goto(`/app/leads/${created.id}`);

    const playbook = page.getByTestId("commercial-playbook");
    await expect(playbook).toHaveAttribute("data-playbook-status", "available");
    await expect(playbook.getByTestId("playbook-signal")).toHaveCount(3);
    await expect(playbook).toContainText("Sem site informado");
    await expect(playbook).not.toContainText("NO_WEBSITE");

    const message = page.getByTestId("playbook-message");
    await expect(message).toContainText("Oi, Marina");
    await expect(message).toContainText(input.companyName);
    await expect(message).toContainText("não encontrei um site claro da clínica");
    await expect(message).not.toContainText("undefined");

    await expect(page.getByTestId("activity-timeline-empty")).toBeVisible();

    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByTestId("playbook-copy").click();
    await expect(page.getByTestId("playbook-copy")).toContainText(
      /Copiado|Copiar mensagem/,
    );
    const d0 = await page.evaluate(() => navigator.clipboard.readText());
    expect(d0).toContain("não encontrei um site claro da clínica");
    expect(d0).toContain("Marina");
    await expect(page.getByTestId("activity-timeline-empty")).toBeVisible();

    const popupPromise = page.waitForEvent("popup");
    await page.getByTestId("playbook-whatsapp").click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/wa\.me|api\.whatsapp\.com/);
    await popup.close();
    await expect(page.getByTestId("activity-timeline-empty")).toBeVisible();

    await page.getByTestId("playbook-step-D2").click();
    await expect(message).toHaveAttribute("data-step", "D2");
    await expect(message).toContainText("10 min");

    await page.getByTestId("playbook-copy").click();
    const d2 = await page.evaluate(() => navigator.clipboard.readText());
    expect(d2).toContain("10 min");
    expect(d2).not.toEqual(d0);

    await page.getByTestId("playbook-register").click();
    await expect(page.getByRole("heading", { name: "Registrar atividade" })).toBeVisible();
    await page.getByLabel("Tipo").selectOption("WHATSAPP");
    await page.getByLabel("Resultado").selectOption("SENT_NO_REPLY");
    await page.getByLabel("Descrição").fill("Cadência D0 enviada via playbook E2E");
    await page.getByLabel(/Próximo passo/).fill("2026-08-16T10:00");
    await page.getByRole("button", { name: "Salvar atividade" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Contato registrado" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByLabel("Histórico").getByText("Cadência D0 enviada via playbook E2E"),
    ).toBeVisible();
  });

  test("playbook stays unavailable outside ICP", async ({ page }) => {
    const stamp = Date.now();
    const created = await createIntelligenceLead({
      companyName: `Restaurante Playbook ${stamp}`,
      phone: `1396${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-playbook-out-${stamp}`,
      intelligence: {
        score: 40,
        qualification: "LOW",
        campaign: "santos-restaurante-2026-07",
        signals: ["NO_WEBSITE"],
        diagnostic: "Fora do ICP.",
        pitch: "Não usar.",
      },
    });

    await login(page, memberEmail, memberPassword);
    await page.goto(`/app/leads/${created.id}`);

    await expect(page.getByTestId("commercial-playbook")).toHaveAttribute(
      "data-playbook-status",
      "unavailable",
    );
    await expect(page.getByTestId("playbook-unavailable")).toHaveText(
      "Playbook comercial indisponível para este lead.",
    );
  });

  test("playbook stays unavailable for another city, and without phone", async ({
    page,
  }) => {
    const stamp = Date.now();
    const otherCity = await createIntelligenceLead({
      companyName: `Clínica Guarujá ${stamp}`,
      phone: `1395${String(stamp).slice(-7)}`,
      ownerEmail: memberEmail,
      externalId: `e2e-playbook-city-${stamp}`,
      intelligence: {
        score: 90,
        qualification: "HIGH",
        campaign: "guaruja-odontologia-2026-07",
        signals: ["NO_WEBSITE", "HIGH_RATING"],
        diagnostic: "Outra cidade.",
        pitch: "Não usar.",
      },
    });
    const noPhone = await createIntelligenceLead({
      companyName: `Clínica Sem Tel ${stamp}`,
      phone: null,
      ownerEmail: memberEmail,
      externalId: `e2e-playbook-nophone-${stamp}`,
      intelligence: {
        score: 90,
        qualification: "HIGH",
        campaign: "santos-odontologia-2026-07",
        signals: ["NO_WEBSITE"],
        diagnostic: "Sem telefone.",
        pitch: "Não usar.",
      },
    });

    await login(page, memberEmail, memberPassword);

    await page.goto(`/app/leads/${otherCity.id}`);
    await expect(page.getByTestId("playbook-unavailable")).toHaveText(
      "Playbook comercial indisponível para este lead.",
    );

    await page.goto(`/app/leads/${noPhone.id}`);
    await expect(page.getByTestId("playbook-unavailable")).toHaveText(
      "Playbook comercial indisponível para este lead.",
    );
  });

  test("MEMBER cannot open another operator lead to reach the playbook", async ({
    page,
  }) => {
    const stamp = Date.now();
    const lead = await createIntelligenceLead(icpLead(stamp, adminEmail));

    await login(page, memberEmail, memberPassword);
    await page.goto(`/app/leads/${lead.id}`);
    await expect(page.getByText(/403|Acesso negado/i).first()).toBeVisible();
    await expect(page.getByTestId("commercial-playbook")).toHaveCount(0);
  });

  test("ADMIN sees playbook on an ICP lead", async ({ page }) => {
    const stamp = Date.now();
    const input = icpLead(stamp, adminEmail);
    const lead = await createIntelligenceLead(input);

    await login(page, adminEmail, adminPassword);
    await page.goto(`/app/leads/${lead.id}`);
    await expect(page.getByTestId("commercial-playbook")).toHaveAttribute(
      "data-playbook-status",
      "available",
    );
    await expect(page.getByTestId("playbook-whatsapp")).toBeVisible();
  });
});

test.describe("commercial playbook UI — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.describe.configure({ timeout: 90_000 });

  test("tabs stay usable without page overflow", async ({ page }) => {
    const stamp = Date.now();
    const input = icpLead(stamp, memberEmail);
    const created = await createIntelligenceLead(input);

    await login(page, memberEmail, memberPassword);
    await page.goto(`/app/leads/${created.id}`);

    await expect(page.getByTestId("commercial-playbook")).toBeVisible();
    await expect(page.getByTestId("playbook-step-REACTIVATION")).toBeVisible();
    await page.getByTestId("playbook-step-REACTIVATION").click();
    await expect(page.getByTestId("playbook-message")).toHaveText(
      "Ainda não há abordagem aprovada para este contexto.",
    );

    const noHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(noHorizontalOverflow).toBe(true);
  });
});
