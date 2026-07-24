/**
 * Production smoke — SkipNav focal (Interaction & Feedback closeout).
 * Credentials from env only — never logged.
 *
 * Required:
 *   SMOKE_BASE_URL (default https://prospecta-ten-tau.vercel.app)
 *   SMOKE_MEMBER_EMAIL / E2E_MEMBER_EMAIL
 *   SMOKE_MEMBER_PASSWORD / E2E_MEMBER_PASSWORD / SEED_MEMBER_PASSWORD
 */
import { chromium, expect } from "@playwright/test";

const baseURL =
  process.env.SMOKE_BASE_URL?.replace(/\/$/, "") ||
  "https://prospecta-ten-tau.vercel.app";
const email =
  process.env.SMOKE_MEMBER_EMAIL ||
  process.env.E2E_MEMBER_EMAIL ||
  "comercial@prospecta.test";
const password =
  process.env.SMOKE_MEMBER_PASSWORD ||
  process.env.E2E_MEMBER_PASSWORD ||
  process.env.SEED_MEMBER_PASSWORD;

if (!password) {
  console.error("Missing SMOKE_MEMBER_PASSWORD / E2E_MEMBER_PASSWORD");
  process.exit(1);
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 30_000 });
}

async function smokeSkipNav(page, label) {
  const results = [];
  await page.goto(`${baseURL}/app/my-leads`, { waitUntil: "networkidle" });

  const skip = page.getByTestId("skip-nav-link");
  await expect(skip).toBeAttached();
  const href = await skip.getAttribute("href");
  results.push([
    `${label} href=#main-content`,
    href === "#main-content" ? "PASS" : `FAIL href=${href}`,
  ]);

  const main = page.locator("main#main-content");
  await expect(main).toBeVisible();
  // Ensure interactive content is painted before Tab-order checks.
  await expect(main.getByRole("link").first()).toBeVisible({ timeout: 15_000 });
  results.push([`${label} main#main-content visible`, "PASS"]);

  await skip.focus();
  await skip.press("Enter");
  await expect
    .poll(async () =>
      page.evaluate(() => document.activeElement?.id ?? null),
    )
    .toBe("main-content");
  results.push([`${label} focus → main-content`, "PASS"]);

  const focusVisible = await page.evaluate(() => {
    const el = document.getElementById("main-content");
    if (!el || document.activeElement !== el) return false;
    const style = getComputedStyle(el);
    const outlineOk =
      style.outlineStyle !== "none" && style.outlineWidth !== "0px";
    const shadowOk = style.boxShadow !== "none" && style.boxShadow !== "";
    return outlineOk || shadowOk;
  });
  results.push([
    `${label} focus visible on main`,
    focusVisible ? "PASS" : "FAIL no visible focus ring",
  ]);

  await page.keyboard.press("Tab");
  const afterTab = await page.evaluate(() => {
    const active = document.activeElement;
    const mainEl = document.getElementById("main-content");
    if (!active || !mainEl) return { ok: false, reason: "missing" };
    return {
      ok: mainEl.contains(active),
      tag: active.tagName,
      id: active.id || null,
      testId: active.getAttribute("data-testid"),
    };
  });
  results.push([
    `${label} next Tab inside main`,
    afterTab.ok
      ? "PASS"
      : `FAIL outside main tag=${afterTab.tag} id=${afterTab.id} testId=${afterTab.testId}`,
  ]);

  return results;
}

const browser = await chromium.launch({ headless: true });
const all = [];

try {
  // Desktop
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await login(page);
    const url = page.url();
    all.push([
      "login/navegação curta",
      /\/app(\/|$)/.test(url) ? "PASS" : `FAIL url=${url}`,
    ]);
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
    all.push(["nav desktop visível", "PASS"]);
    all.push(...(await smokeSkipNav(page, "desktop")));
    await context.close();
  }

  // Mobile 390×844
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await login(page);
    all.push(...(await smokeSkipNav(page, "mobile 390")));
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("\nSkipNav production smoke");
console.log(`base: ${baseURL}`);
let failed = false;
for (const [name, result] of all) {
  console.log(`- ${name}: ${result}`);
  if (!String(result).startsWith("PASS")) failed = true;
}
console.log(failed ? "\nOVERALL FAIL" : "\nOVERALL PASS");
process.exit(failed ? 1 : 0);
