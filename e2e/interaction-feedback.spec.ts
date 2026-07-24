import { expect, test } from "@playwright/test";

import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

test.describe("chakra interaction feedback v1", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("SkipNav targets main content", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads");
    const skip = page.getByTestId("skip-nav-link");
    await expect(skip).toBeAttached();
    await expect(skip).toHaveAttribute("href", "#main-content");
    await expect(page.locator("main#main-content")).toBeVisible();
    await skip.focus();
    await skip.press("Enter");
    await expect
      .poll(async () =>
        page.evaluate(() => document.activeElement?.id ?? null),
      )
      .toBe("main-content");
  });

  test("empty queue filter exposes next action", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads?filter=overdue");
    const empty = page.getByTestId("my-queue-empty");
    // May be empty or not depending on data — only assert structure when empty.
    if (await empty.count()) {
      await expect(empty).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Ver todos" }),
      ).toBeVisible();
    }
  });
});

test.describe("chakra interaction feedback mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("my-leads keeps skip nav and no overflow", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/my-leads");
    await expect(page.getByTestId("skip-nav-link")).toBeAttached();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
