import { expect, test } from "@playwright/test";

import { login } from "./helpers";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";
const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("visual foundation desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("home greets admin and exposes role shortcuts", async ({ page }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: /^Olá,/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Minha fila" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Usuários" }).first()).toBeVisible();
    await expect(page.locator("main")).toHaveAttribute("data-page-width", "list");
  });

  test("pipeline first fold shows collapsible stages", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/pipeline");
    await expect(page.getByRole("heading", { name: "Pipeline", exact: true })).toBeVisible();
    const desktop = page.getByTestId("pipeline-desktop");
    await expect(desktop).toBeVisible();
    await expect(desktop.getByTestId("pipeline-desktop-stage-NEW")).toBeVisible();
    await expect(desktop.getByTestId("pipeline-desktop-stage-MEETING")).toBeVisible();
    await expect(desktop.getByTestId("pipeline-desktop-stage-LOST")).toBeVisible();

    const foldBox = await desktop.boundingBox();
    expect(foldBox).toBeTruthy();
    // Stage headers must fit the first viewport without needing a long scroll hunt.
    expect(foldBox!.y).toBeLessThan(900);
  });

  test("form and list page widths differ as designed", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/leads/new");
    await expect(page.locator("main")).toHaveAttribute("data-page-width", "form");
    await page.goto("/app/my-leads");
    await expect(page.locator("main")).toHaveAttribute("data-page-width", "list");
  });
});


test.describe("visual foundation mobile critical", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("my-leads has no horizontal overflow and keeps bottom nav", async ({
    page,
  }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads");
    await expect(page.getByRole("heading", { name: "Minha operação" })).toBeVisible();
    await expect(page.getByTestId("mobile-nav-my-leads")).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });

  test("pipeline mobile accordion remains available", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/pipeline");
    await expect(page.getByTestId("pipeline-mobile")).toBeVisible();
    await expect(page.getByTestId("pipeline-desktop")).toBeHidden();
    await expect(page.getByTestId("pipeline-mobile-stage-NEW")).toBeVisible();
  });
});
