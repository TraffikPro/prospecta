import { chromium, expect } from "@playwright/test";

const baseURL = process.env.SMOKE_BASE_URL.replace(/\/$/, "");
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || "admin@prospecta.test";
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;
const memberEmail = process.env.SMOKE_MEMBER_EMAIL || "comercial@prospecta.test";
const memberPassword = process.env.SMOKE_MEMBER_PASSWORD;

async function login(page, email, password) {
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname === "/app" || url.pathname.startsWith("/app/"));
}

const results = [];
function pass(name) { results.push({ name, ok: true }); console.log("PASS", name); }
function fail(name, err) { results.push({ name, ok: false, err: String(err) }); console.error("FAIL", name, err); }

async function main() {
  const browser = await chromium.launch();

  // Desktop ADMIN home
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await login(page, adminEmail, adminPassword);
      await page.goto(`${baseURL}/app`);
      await expect(page.getByRole("heading", { name: /^Olá,/ })).toBeVisible({ timeout: 20000 });
      await expect(page.getByRole("link", { name: "Usuários" }).first()).toBeVisible();
      pass("desktop-admin-home");
    } catch (e) {
      fail("desktop-admin-home", e);
    }
    await ctx.close();
  }

  // Desktop MEMBER my-leads + pipeline
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await login(page, memberEmail, memberPassword);
      await page.goto(`${baseURL}/app/my-leads`);
      await expect(page.getByRole("heading", { name: "Minha operação" })).toBeVisible();
      pass("desktop-member-my-leads");

      await page.goto(`${baseURL}/app/pipeline`);
      await expect(page.getByTestId("pipeline-desktop")).toBeVisible();
      await expect(page.getByTestId("pipeline-desktop-stage-NEW")).toBeVisible();
      await expect(page.getByTestId("pipeline-desktop-stage-LOST")).toBeVisible();
      const box = await page.getByTestId("pipeline-desktop").boundingBox();
      if (!box || box.y >= 900) throw new Error("pipeline not in first fold");
      pass("desktop-pipeline-first-fold");
    } catch (e) {
      fail("desktop-member-suite", e);
    }
    await ctx.close();
  }

  // Mobile MEMBER
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await login(page, memberEmail, memberPassword);
      await page.goto(`${baseURL}/app/my-leads`);
      await expect(page.getByRole("heading", { name: "Minha operação" })).toBeVisible();
      await expect(page.getByTestId("mobile-nav-my-leads")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (overflow) throw new Error("horizontal overflow on my-leads");
      pass("mobile-my-leads-no-overflow");

      await page.goto(`${baseURL}/app/pipeline`);
      await expect(page.getByTestId("pipeline-mobile")).toBeVisible();
      await expect(page.getByTestId("pipeline-desktop")).toBeHidden();
      const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (overflow2) throw new Error("horizontal overflow on pipeline");
      pass("mobile-pipeline-no-overflow");

      await page.goto(`${baseURL}/app`);
      await expect(page.getByRole("heading", { name: /^Olá,/ })).toBeVisible();
      pass("mobile-member-home");
    } catch (e) {
      fail("mobile-suite", e);
    }
    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ results, failed: failed.length }, null, 2));
  if (failed.length) process.exit(1);
}

main();
