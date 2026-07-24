import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("pipeline foundation", () => {
  test("member moves lead stage and sees STAGE_CHANGE in history", async ({
    page,
  }) => {
    const stamp = Date.now();
    const company = `Empresa Pipeline E2E ${stamp}`;
    const email = `pipeline-e2e-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);

    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(company);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(/\/app\/leads\/.+/);
    await expect(page.getByTestId("lead-stage")).toHaveAttribute(
      "data-stage",
      "NEW",
    );

    await page.goto("/app/pipeline");
    await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
    await expect(page.getByTestId("pipeline-stage-NEW")).toBeVisible();
    await page.getByRole("link", { name: company, exact: true }).click();
    await page.waitForURL(/\/app\/leads\/.+/);

    await page.getByTestId("move-stage-select").selectOption("MEETING");
    await page.getByTestId("move-stage-submit").click();

    await expect(page.getByTestId("lead-stage")).toHaveAttribute(
      "data-stage",
      "MEETING",
      { timeout: 15_000 },
    );
    await expect(page.getByText("Mudança de stage")).toBeVisible();
    await expect(page.getByText("Novo → Reunião")).toBeVisible();
  });

  test("LOST without reason fails; with reason succeeds", async ({ page }) => {
    const stamp = Date.now();
    const company = `Empresa Lost E2E ${stamp}`;
    const email = `lost-e2e-${stamp}@acme.example`;

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/leads/new");
    await page.getByLabel("Empresa").fill(company);
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(/\/app\/leads\/.+/);

    await page.getByTestId("move-stage-select").selectOption("LOST");
    await expect(page.getByTestId("lost-reason")).toBeVisible();
    await page.getByTestId("move-stage-submit").click();
    await expect(
      page.getByText("Motivo é obrigatório ao marcar como perdido"),
    ).toBeVisible();
    await expect(page.getByTestId("lead-stage")).toHaveAttribute(
      "data-stage",
      "NEW",
    );

    await page.reload();
    await page.getByTestId("move-stage-select").selectOption("LOST");
    await page.getByTestId("lost-reason").fill("Sem orçamento no trimestre");
    await page.getByTestId("move-stage-submit").click();
    await expect(page.getByTestId("lead-stage")).toHaveAttribute(
      "data-stage",
      "LOST",
      { timeout: 15_000 },
    );
  });
});
