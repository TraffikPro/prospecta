import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("activity foundation", () => {
  test("create lead, register WhatsApp, stage becomes CONTACTED and timeline shows activity", async ({
    page,
  }) => {
    const stamp = Date.now();
    const company = `Empresa Activity E2E ${stamp}`;
    const email = `activity-e2e-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);

    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(company);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(/\/app\/leads\/.+/);

    await expect(page.getByTestId("lead-stage")).toHaveText("NEW");

    await page.getByLabel("Tipo").selectOption("WHATSAPP");
    await page.getByLabel("Resultado").selectOption("INTERESTED");
    await page.getByLabel("Descrição").fill("Falou com responsável financeiro");
    await page.getByLabel(/Próximo passo/).fill("2026-07-28T10:30");
    await page.getByRole("button", { name: "Salvar atividade" }).click();

    await expect(page.getByText("Atividade registrada.")).toBeVisible();
    await expect(page.getByTestId("lead-stage")).toHaveText("CONTACTED");
    await expect(page.getByText("Falou com responsável financeiro")).toBeVisible();
    await expect(page.getByText("Resultado: Interessado")).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: "WhatsApp" }).first(),
    ).toBeVisible();
  });
});
