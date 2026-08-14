import { expect, test } from "@playwright/test";

import { login } from "./helpers";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";
const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("operational dashboard", () => {
  test("ADMIN sees the aggregated overview and management CTAs", async ({
    page,
  }) => {
    await login(page, adminEmail, adminPassword);
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: "Visão geral", exact: true }),
    ).toBeVisible();
    const dashboard = page.getByTestId("operational-dashboard");
    await expect(dashboard).toHaveAttribute("data-dashboard-kind", "team");
    await expect(page.getByTestId("dashboard-kpi-grid")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-target")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-assigned")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-treated")).toBeVisible();
    await expect(page.getByTestId("dashboard-kpi-pending")).toBeVisible();
    await expect(
      dashboard.getByRole("link", { name: "Ver equipe" }),
    ).toHaveAttribute("href", "/admin/users");
    await expect(
      dashboard.getByRole("link", { name: "Revisar HIGH" }),
    ).toHaveAttribute("href", "/admin/high-pool");
  });

  test("MEMBER sees own KPIs and a queue CTA, not the admin dashboard", async ({
    page,
  }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: "Visão geral", exact: true }),
    ).toBeVisible();
    const dashboard = page.getByTestId("operational-dashboard");
    await expect(dashboard).toHaveAttribute("data-dashboard-kind", "operator");
    await expect(page.getByTestId("dashboard-kpi-grid")).toBeVisible();
    await expect(
      dashboard.getByRole("link", {
        name: /Ver minha fila|Tratar pendências|Ir para Minha fila/,
      }),
    ).toHaveAttribute("href", "/app/my-leads");
    await expect(
      dashboard.getByRole("link", { name: "Ver equipe" }),
    ).toHaveCount(0);
    await expect(
      dashboard.getByRole("link", { name: "Revisar HIGH" }),
    ).toHaveCount(0);
  });
});

test.describe("operational dashboard mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("does not require horizontal scroll", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app");
    await expect(page.getByTestId("operational-dashboard")).toBeVisible();
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });
});
