import { expect, test } from "@playwright/test";

import { login } from "./helpers";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";
const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("navigation action badges desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("MEMBER can see queue badge and never receives HIGH review badge", async ({
    page,
  }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads");
    const sidebar = page.getByTestId("desktop-sidebar");
    await expect(sidebar.getByRole("link", { name: /Minha fila/ })).toBeVisible();
    await expect(sidebar.getByTestId("nav-badge-high-pool")).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "Revisão HIGH" })).toHaveCount(0);
  });

  test("ADMIN sidebar keeps HIGH review and still shows Minha fila", async ({
    page,
  }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/app");
    const sidebar = page.getByTestId("desktop-sidebar");
    await expect(sidebar.getByRole("link", { name: /Minha fila/ })).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: /Revisão HIGH/ }),
    ).toBeVisible();
  });

  test("collapsed sidebar keeps tooltips and does not overflow", async ({
    page,
  }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/app");
    const sidebar = page.getByTestId("desktop-sidebar");
    await sidebar.getByTestId("sidebar-collapse").click();
    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    await expect(sidebar.getByRole("link", { name: /Minha fila/ })).toBeVisible();
    const overflow = await page.evaluate(() => {
      const el = document.querySelector("[data-testid='desktop-sidebar']");
      if (!(el instanceof HTMLElement)) return true;
      return el.scrollWidth > el.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });
});

test.describe("navigation action badges mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Fila stays labeled and More can show HIGH badge for ADMIN only", async ({
    page,
  }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads");
    await expect(page.getByTestId("mobile-nav-my-leads")).toContainText("Fila");
    await expect(page.getByTestId("nav-badge-high-pool")).toHaveCount(0);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
    expect(overflow).toBe(false);

    await page.getByTestId("mobile-nav-more").click();
    await expect(page.getByRole("heading", { name: "Mais", exact: true })).toBeVisible();
    await expect(page.getByTestId("nav-badge-high-pool")).toHaveCount(0);
  });
});
