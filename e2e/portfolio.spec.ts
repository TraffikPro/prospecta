import { expect, test } from "./test";

import { login } from "./helpers";

const memberEmail =
  process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

const DEMO_PATHS = [
  "/portfolio/odontologia-familiar/index.html",
  "/portfolio/odontologia-premium/index.html",
  "/portfolio/odontologia-individual/index.html",
] as const;

/** Claims that imply real clients or delivered results (negated disclaimers are OK). */
const FORBIDDEN_CLAIM =
  /clientes atendidos|projetos entregues|resultados obtidos|nossos clientes|cases? de sucesso/i;

async function noHorizontalOverflow(page: {
  evaluate: (fn: () => boolean) => Promise<boolean>;
}) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
}

test.describe("demos commercial gallery (F13) desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("catalog, typographic covers, absolute copy, public demos", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: baseURL ?? "http://127.0.0.1:3000",
    });

    await login(page, memberEmail, memberPassword);
    await page.goto("/app/portfolio");

    await expect(
      page.getByRole("heading", { name: "Demos comerciais", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("portfolio-disclaimer")).toBeVisible();
    await expect(page.getByTestId("portfolio-grid")).toBeVisible();
    await expect(page.getByText("Portfólio", { exact: true })).toHaveCount(0);

    const cards = page.getByTestId("portfolio-card");
    await expect(cards).toHaveCount(3);

    for (const card of await cards.all()) {
      await expect(card.getByTestId("portfolio-cover-accent")).toHaveAttribute(
        "data-cover-kind",
        "typographic",
      );
      await expect(card.getByTestId("portfolio-demo-label")).toContainText(
        "DevFlow Labs",
      );
      await expect(card.getByTestId("portfolio-open-demo")).toContainText(
        "Abrir demo",
      );
      await expect(card).not.toContainText(FORBIDDEN_CLAIM);
      // Page-level disclaimer only — not repeated inside each card.
      await expect(card.getByTestId("portfolio-card-disclaimer")).toHaveCount(0);
    }

    const firstCard = cards.first();
    await firstCard.getByTestId("portfolio-copy-link").click();
    await expect(firstCard.getByTestId("portfolio-copy-link")).toContainText(
      "Link copiado",
    );

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toMatch(/^https?:\/\/.+/);
    expect(copied).toMatch(/\/portfolio\/odontologia-[a-z-]+\/index\.html$/);
    const allowedBases = [
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, ""),
      baseURL ? new URL(baseURL).origin : undefined,
      "http://127.0.0.1:3000",
      "https://prospecta-ten-tau.vercel.app",
    ].filter((value): value is string => Boolean(value));
    expect(
      allowedBases.some((base) => copied.startsWith(base)),
      `copied URL ${copied} not under allowed bases ${allowedBases.join(", ")}`,
    ).toBe(true);

    const demoPage = await context.newPage();
    for (const path of DEMO_PATHS) {
      const response = await demoPage.goto(path);
      expect(response?.ok()).toBe(true);
      await expect(demoPage.locator(".banner")).toContainText(
        "Modelo demonstrativo",
      );
      await expect(demoPage.locator(".banner")).toContainText("DevFlow Labs");
      await expect(demoPage.locator("body")).not.toContainText(FORBIDDEN_CLAIM);
      await expect(demoPage).not.toHaveURL(/\/login/);
    }
    await demoPage.close();

    await page.goto("/app/portfolio");
    await expect(
      page.getByRole("heading", { name: "Demos comerciais", exact: true }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("demos commercial gallery (F13) medium", () => {
  test.use({ viewport: { width: 768, height: 900 } });

  test("two-column friendly grid without Portfólio naming", async ({
    page,
  }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/portfolio");
    await expect(page.getByTestId("portfolio-grid")).toBeVisible();
    await expect(page.getByTestId("portfolio-card")).toHaveCount(3);
    await expect(page.getByText("Portfólio", { exact: true })).toHaveCount(0);
    expect(await noHorizontalOverflow(page)).toBe(true);
  });
});

test.describe("demos commercial gallery (F13) mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("reachable from Mais without overflow", async ({ page }) => {
    await login(page, memberEmail, memberPassword);
    await page.goto("/app/more");
    await page.getByRole("link", { name: "Demos", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/portfolio/);
    await expect(
      page.getByRole("heading", { name: "Demos comerciais", exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("mobile-nav-more")).toBeVisible();

    expect(await noHorizontalOverflow(page)).toBe(true);

    const cards = page.getByTestId("portfolio-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.first().getByTestId("portfolio-open-demo")).toBeVisible();
    await expect(
      cards.first().getByTestId("portfolio-cover-accent"),
    ).toHaveAttribute("data-cover-kind", "typographic");
  });
});
