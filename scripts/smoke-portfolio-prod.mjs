import { chromium, expect } from "@playwright/test";

/**
 * Production UI smoke for Portfolio Comercial v1.
 * No DB mutation. No credentials in repo.
 *
 * Required (set only in the local process — do not commit to .env):
 *   SMOKE_ADMIN_EMAIL
 *   SMOKE_ADMIN_PASSWORD
 *   SMOKE_MEMBER_EMAIL
 *   SMOKE_MEMBER_PASSWORD
 *
 * Optional:
 *   SMOKE_BASE_URL (default https://prospecta-ten-tau.vercel.app)
 */

const baseURL = (
  process.env.SMOKE_BASE_URL || "https://prospecta-ten-tau.vercel.app"
).replace(/\/$/, "");

const adminEmail = process.env.SMOKE_ADMIN_EMAIL?.trim();
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;
const memberEmail = process.env.SMOKE_MEMBER_EMAIL?.trim();
const memberPassword = process.env.SMOKE_MEMBER_PASSWORD;

const DEMO_PATHS = [
  "/portfolio/odontologia-familiar/index.html",
  "/portfolio/odontologia-premium/index.html",
  "/portfolio/odontologia-individual/index.html",
];

const FORBIDDEN =
  /clientes atendidos|projetos entregues|resultados obtidos|nossos clientes|cases? de sucesso/i;

const results = [];
function pass(name) {
  results.push({ name, ok: true });
  console.log("PASS", name);
}
function fail(name, err) {
  results.push({ name, ok: false, err: String(err) });
  console.error("FAIL", name, err);
}

async function login(page, email, password) {
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(
    (url) => url.pathname === "/app" || url.pathname.startsWith("/app/"),
    { timeout: 20000 },
  );
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  if (overflow) throw new Error("horizontal overflow");
}

async function main() {
  console.log("smoke base:", baseURL);

  const missing = [
    ["SMOKE_ADMIN_EMAIL", adminEmail],
    ["SMOKE_ADMIN_PASSWORD", adminPassword],
    ["SMOKE_MEMBER_EMAIL", memberEmail],
    ["SMOKE_MEMBER_PASSWORD", memberPassword],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    console.error(
      "Missing required env (set temporarily in this process only):",
      missing.join(", "),
    );
    process.exit(2);
  }

  const browser = await chromium.launch();

  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      for (const demoPath of DEMO_PATHS) {
        const response = await page.goto(`${baseURL}${demoPath}`);
        if (!response?.ok()) {
          throw new Error(`${demoPath} status ${response?.status()}`);
        }
        await expect(page.locator(".banner")).toContainText(
          "Modelo demonstrativo",
        );
        await expect(page.locator(".banner")).toContainText("DevFlow Labs");
        const body = await page.locator("body").innerText();
        if (FORBIDDEN.test(body)) {
          throw new Error(`forbidden claim in ${demoPath}`);
        }
      }
      pass("anonymous-three-demos");
    } catch (e) {
      fail("anonymous-three-demos", e);
    }
    await ctx.close();
  }

  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto(`${baseURL}/app/portfolio`);
      await page.waitForURL(/\/login/, { timeout: 15000 });
      pass("portfolio-requires-auth");
    } catch (e) {
      fail("portfolio-requires-auth", e);
    }
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    try {
      await login(page, adminEmail, adminPassword);
      await page.goto(`${baseURL}/app`);
      await expect(
        page.getByRole("link", { name: "Portfólio" }).first(),
      ).toBeVisible();
      await page.goto(`${baseURL}/app/portfolio`);
      await expect(
        page.getByRole("heading", { name: "Portfólio comercial", exact: true }),
      ).toBeVisible();
      await expect(page.getByTestId("portfolio-grid")).toBeVisible();
      await expect(page.getByTestId("portfolio-card")).toHaveCount(3);
      await expect(
        page.getByTestId("portfolio-card-disclaimer").first(),
      ).toBeVisible();
      await page.getByTestId("portfolio-open-demo").first().click();
      // Demo opens in new tab via target=_blank — verify href instead.
      const href = await page
        .getByTestId("portfolio-open-demo")
        .first()
        .getAttribute("href");
      if (!href || !href.includes("/portfolio/")) {
        throw new Error(`unexpected open-demo href: ${href}`);
      }
      await page.goto(`${baseURL}/app/my-leads`);
      await expect(
        page.getByRole("heading", { name: "Minha operação" }),
      ).toBeVisible();
      pass("desktop-admin-portfolio");
    } catch (e) {
      fail("desktop-admin-portfolio", e);
    }
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await ctx.newPage();
    try {
      await login(page, memberEmail, memberPassword);
      await page.goto(`${baseURL}/app/more`);
      await page.getByRole("link", { name: "Portfólio", exact: true }).click();
      await expect(page).toHaveURL(/\/app\/portfolio/);
      await assertNoOverflow(page);
      await expect(page.getByTestId("portfolio-card")).toHaveCount(3);

      await page.getByTestId("portfolio-copy-link").first().click();
      await expect(page.getByTestId("portfolio-copy-link").first()).toHaveText(
        "Link copiado",
        { timeout: 5000 },
      );
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      if (!copied.startsWith(baseURL)) {
        throw new Error(`copy not absolute production URL: ${copied}`);
      }
      if (!/\/portfolio\/odontologia-.+\/index\.html$/.test(copied)) {
        throw new Error(`copy path unexpected: ${copied}`);
      }

      const anon = await browser.newContext();
      const anonPage = await anon.newPage();
      const demoRes = await anonPage.goto(copied);
      if (!demoRes?.ok()) {
        throw new Error(`copied link status ${demoRes?.status()}`);
      }
      await expect(anonPage.locator(".banner")).toContainText("DevFlow Labs");
      await anon.close();

      await page.goto(`${baseURL}/app/portfolio`);
      await expect(
        page.getByRole("heading", { name: "Portfólio comercial", exact: true }),
      ).toBeVisible();
      await expect(page).not.toHaveURL(/\/login/);

      await page.goto(`${baseURL}/app/my-leads`);
      await expect(
        page.getByRole("heading", { name: "Minha operação" }),
      ).toBeVisible();
      await expect(page.getByTestId("mobile-nav-my-leads")).toBeVisible();
      await assertNoOverflow(page);
      pass("mobile-member-portfolio-copy-my-leads");
    } catch (e) {
      fail("mobile-member-portfolio-copy-my-leads", e);
    }
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ baseURL, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
