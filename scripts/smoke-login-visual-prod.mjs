/**
 * Production smoke — Login Visual Refresh closeout.
 * UI-only against /login (no DB mutation required for layout checks).
 *
 * Optional login check (not required for OVERALL PASS of layout):
 *   SMOKE_MEMBER_EMAIL / E2E_MEMBER_EMAIL
 *   SMOKE_MEMBER_PASSWORD / E2E_MEMBER_PASSWORD / SEED_MEMBER_PASSWORD
 */
import { chromium, expect } from "@playwright/test";

const baseURL = (
  process.env.SMOKE_BASE_URL || "https://prospecta-ten-tau.vercel.app"
).replace(/\/$/, "");

const email =
  process.env.SMOKE_MEMBER_EMAIL ||
  process.env.E2E_MEMBER_EMAIL ||
  "comercial@prospecta.test";
const password =
  process.env.SMOKE_MEMBER_PASSWORD ||
  process.env.E2E_MEMBER_PASSWORD ||
  process.env.SEED_MEMBER_PASSWORD;

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(ok ? "PASS" : "FAIL", name, detail);
}

async function measureLogin(page) {
  return page.evaluate(() => {
    const brand = document.querySelector('[data-testid="login-brand-panel"]');
    const mobileBar = document.querySelector(
      '[data-testid="login-mobile-brand-bar"]',
    );
    const form = document.querySelector("form");
    const cardRoot =
      form?.closest(".chakra-card__root") || form?.parentElement?.parentElement;
    const cta = document.querySelector('button[type="submit"]');
    const wordmarks = [
      ...document.querySelectorAll('[data-testid="prospecta-wordmark"]'),
    ].filter((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const visible = (el) => {
      if (!el) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const rect = (el) => {
      if (!el || !visible(el)) return null;
      const r = el.getBoundingClientRect();
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        bottom: Math.round(r.bottom),
      };
    };
    return {
      overflow:
        document.documentElement.scrollWidth > window.innerWidth + 1,
      brandVisible: visible(brand),
      mobileBarVisible: visible(mobileBar),
      mobileBarH: rect(mobileBar)?.h ?? 0,
      brandW: rect(brand)?.w ?? 0,
      cardW: rect(cardRoot)?.w ?? 0,
      visibleWordmarks: wordmarks.length,
      ctaInFirstFold: cta
        ? cta.getBoundingClientRect().bottom <= window.innerHeight
        : false,
      h1: document.querySelector("h1")?.textContent?.trim() ?? "",
    };
  });
}

async function smokeViewport(browser, label, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  try {
    await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: "Bem-vindo de volta", exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    record(`${label} h1 Bem-vindo de volta`, true);

    const m = await measureLogin(page);
    if (viewport.width >= 1024) {
      record(`${label} brand panel visible`, m.brandVisible);
      record(`${label} mobile bar hidden`, !m.mobileBarVisible);
      record(
        `${label} split ~55%`,
        m.brandW >= viewport.width * 0.5 && m.brandW <= viewport.width * 0.6,
        `brandW=${m.brandW}`,
      );
      record(
        `${label} card ~440px`,
        m.cardW >= 400 && m.cardW <= 448,
        `cardW=${m.cardW}`,
      );
    } else {
      record(`${label} brand panel hidden`, !m.brandVisible);
      record(`${label} mobile bar visible`, m.mobileBarVisible);
      record(
        `${label} single visible wordmark`,
        m.visibleWordmarks === 1,
        `count=${m.visibleWordmarks}`,
      );
      record(
        `${label} top bar compact`,
        m.mobileBarH > 0 && m.mobileBarH <= 96,
        `h=${m.mobileBarH}`,
      );
    }

    record(`${label} CTA first fold`, m.ctaInFirstFold);
    record(`${label} no horizontal overflow`, !m.overflow);

    await page.goto(`${baseURL}/login?reason=session_expired`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByTestId("session-expired-alert")).toBeVisible();
    record(`${label} session-expired alert`, true);

    await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
    await page.getByLabel("E-mail", { exact: true }).fill("nobody@prospecta.test");
    await page.getByLabel("Senha", { exact: true }).fill("WrongPassword1!");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
    record(`${label} invalid credentials alert`, true);

    await expect(
      page.getByRole("link", { name: "Esqueci minha senha" }),
    ).toBeVisible();
    record(`${label} forgot-password link`, true);
  } catch (err) {
    record(`${label} suite`, false, String(err));
  } finally {
    await ctx.close();
  }
}

async function optionalLogin(browser) {
  if (!password) {
    record("optional login", true, "SKIPPED (no password env)");
    return;
  }
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/app(\/|$)/, { timeout: 30_000 });
    record("optional login reaches /app", true);
  } catch (err) {
    record("optional login reaches /app", false, String(err));
  } finally {
    await ctx.close();
  }
}

async function main() {
  console.log("SMOKE_BASE_URL", baseURL);
  const browser = await chromium.launch();
  await smokeViewport(browser, "desktop-1440x900", {
    width: 1440,
    height: 900,
  });
  await smokeViewport(browser, "mobile-390x844", {
    width: 390,
    height: 844,
  });
  await optionalLogin(browser);
  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ results, failed: failed.length }, null, 2));
  if (failed.length) process.exit(1);
  console.log("OVERALL PASS");
}

main();
