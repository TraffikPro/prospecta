/**
 * Production smoke — Breadcrumb Navigation v1.
 * Credentials from env only (never logged).
 */
import { chromium, expect } from "@playwright/test";

const baseURL =
  process.env.SMOKE_BASE_URL?.replace(/\/$/, "") ||
  "https://prospecta-ten-tau.vercel.app";
const memberEmail =
  process.env.SMOKE_MEMBER_EMAIL ||
  process.env.E2E_MEMBER_EMAIL ||
  "comercial@prospecta.test";
const memberPassword =
  process.env.SMOKE_MEMBER_PASSWORD ||
  process.env.E2E_MEMBER_PASSWORD ||
  process.env.SEED_MEMBER_PASSWORD;
const adminEmail =
  process.env.SMOKE_ADMIN_EMAIL ||
  process.env.E2E_ADMIN_EMAIL ||
  "admin@prospecta.test";
const adminPassword =
  process.env.SMOKE_ADMIN_PASSWORD ||
  process.env.E2E_ADMIN_PASSWORD ||
  process.env.SEED_ADMIN_PASSWORD;

if (!memberPassword || !adminPassword) {
  console.error("Missing smoke credentials in env");
  process.exit(1);
}

const results = [];
const stamp = Date.now();

function pass(name) {
  results.push([name, "PASS"]);
}
function fail(name, detail) {
  results.push([name, `FAIL ${detail ?? ""}`.trim()]);
}
function skip(name, detail) {
  results.push([name, `SKIP ${detail ?? ""}`.trim()]);
}

async function noOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
}

async function loginAs(page, email, password) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  try {
    await page.waitForURL(/\/app(\/|$)/, { timeout: 45_000 });
  } catch (error) {
    const url = page.url();
    const alert = await page
      .getByRole("alert")
      .first()
      .innerText()
      .catch(() => "");
    throw new Error(
      `login failed url=${url} alert=${alert || "(none)"} cause=${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function logoutViaMore(page) {
  const moreNav = page.getByTestId("mobile-nav-more");
  if (await moreNav.isVisible().catch(() => false)) {
    await moreNav.click();
  } else {
    await page.goto(`${baseURL}/app/more`);
  }
  await page.waitForURL(/\/app\/more/);
  await page.getByRole("main").getByRole("button", { name: "Sair" }).click();
  await page.waitForURL(/\/login/);
}

const browser = await chromium.launch({ headless: true });

try {
  // --- Desktop contextual journeys ---
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await loginAs(page, memberEmail, memberPassword);

    // Minha fila?filter=new → lead → breadcrumb back
    await page.goto(`${baseURL}/app/my-leads?filter=new`);
    const queueCard = page.getByTestId("my-queue-card").first();
    if ((await queueCard.count()) === 0) {
      skip("fila → lead → Minha fila", "fila vazia no filtro new");
    } else {
      const company = (
        await queueCard.locator("p").first().innerText()
      ).trim();
      await queueCard.getByRole("link", { name: "Abrir lead" }).click();
      await page.waitForURL(/\/app\/leads\/.+/);
      await expect(page).toHaveURL(/from=my-leads/);
      await expect(page).toHaveURL(/filter=new/);
      await expect(page.getByTestId("breadcrumb-link")).toHaveText("Minha fila");
      await expect(page.getByTestId("breadcrumb-current")).toContainText(
        company.slice(0, 12),
      );
      await page.getByTestId("breadcrumb-link").click();
      await expect(page).toHaveURL(/\/app\/my-leads\?filter=new/);
      pass("Minha fila?filter=new → lead → ← Minha fila (filtro ok)");
    }

    // Inteligência → lead → back
    await page.goto(`${baseURL}/app/intelligence`);
    const intelCard = page.getByTestId("intelligence-inbox-card").first();
    if ((await intelCard.count()) === 0) {
      skip("inteligência → lead", "inbox vazia");
    } else {
      await intelCard.click();
      await page.waitForURL(/\/app\/leads\/.+/);
      await expect(page).toHaveURL(/from=intelligence/);
      await expect(page.getByTestId("breadcrumb-link")).toHaveText(
        "Inteligência",
      );
      await page.getByTestId("breadcrumb-link").click();
      await expect(page).toHaveURL(/\/app\/intelligence/);
      pass("Inteligência → lead → ← Inteligência");
    }

    // Pipeline → lead → back
    await page.goto(`${baseURL}/app/pipeline`);
    const pipelineLink = page
      .getByTestId("pipeline-desktop")
      .getByRole("link", { name: "Abrir lead" })
      .first();
    if ((await pipelineLink.count()) === 0) {
      skip("pipeline → lead", "sem leads no pipeline");
    } else {
      await pipelineLink.click();
      await page.waitForURL(/\/app\/leads\/.+/);
      await expect(page).toHaveURL(/from=pipeline/);
      await expect(page.getByTestId("breadcrumb-link")).toHaveText("Pipeline");
      await page.getByTestId("breadcrumb-link").click();
      await expect(page).toHaveURL(/\/app\/pipeline/);
      pass("Pipeline → lead → ← Pipeline");
    }

    // Leads → Novo lead → Leads
    await page.goto(`${baseURL}/app/leads/new`);
    await expect(page.getByTestId("breadcrumb-link")).toHaveText("Leads");
    await expect(page.getByTestId("breadcrumb-current")).toHaveText("Novo lead");
    await page.getByTestId("breadcrumb-link").click();
    await expect(page).toHaveURL(/\/app\/leads$/);
    pass("Leads → Novo lead → Leads");

    // Browser back vs breadcrumb: open lead from fila, go back via history
    await page.goto(`${baseURL}/app/my-leads?filter=new`);
    if ((await page.getByTestId("my-queue-card").count()) > 0) {
      await page
        .getByTestId("my-queue-card")
        .first()
        .getByRole("link", { name: "Abrir lead" })
        .click();
      await page.waitForURL(/\/app\/leads\/.+/);
      await page.goBack();
      await expect(page).toHaveURL(/\/app\/my-leads\?filter=new/);
      pass("voltar do navegador preserva filter da fila");
    } else {
      skip("voltar do navegador", "fila vazia");
    }

    // Invalid origin → Leads
    await page.goto(
      `${baseURL}/app/leads/does-not-matter-for-crumb?from=https://evil.example`,
    );
    // may 404 — use a real lead id from previous navigation if available
    await page.goto(`${baseURL}/app/my-leads`);
    const anyCard = page.getByTestId("my-queue-card").first();
    if ((await anyCard.count()) > 0) {
      const href = await anyCard
        .getByTestId("my-queue-card-link")
        .getAttribute("href");
      const id = href?.match(/\/app\/leads\/([^?/]+)/)?.[1];
      if (id) {
        await page.goto(
          `${baseURL}/app/leads/${id}?from=${encodeURIComponent("https://evil.example")}`,
        );
        await expect(page.getByTestId("breadcrumb-link")).toHaveText("Leads");
        await page.getByTestId("breadcrumb-link").click();
        await expect(page).toHaveURL(/\/app\/leads$/);
        pass("origem inválida cai em Leads");
      } else {
        skip("origem inválida", "não extraiu lead id");
      }
    } else {
      skip("origem inválida", "sem leads");
    }

    await logoutViaMore(page);
    await context.close();
  }

  // --- Mobile 390 (MEMBER) — before ADMIN to avoid auth churn ---
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await loginAs(page, memberEmail, memberPassword);

    await expect(page.getByTestId("mobile-nav-my-leads")).toBeVisible();
    pass("bottom nav presente no mobile");

    await page.goto(`${baseURL}/app/my-leads?filter=new`);
    if ((await page.getByTestId("my-queue-card").count()) > 0) {
      await page
        .getByTestId("my-queue-card")
        .first()
        .getByRole("link", { name: "Abrir lead" })
        .click();
      await page.waitForURL(/\/app\/leads\/.+/);
      await expect(page.getByTestId("app-breadcrumbs")).toBeHidden();
      await expect(page.getByTestId("mobile-context-back")).toBeVisible();
      await expect(page.getByTestId("mobile-context-back")).toContainText(
        "Minha fila",
      );
      pass("mobile: back compacto / truncate ok");

      if (await noOverflow(page)) pass("mobile: sem overflow horizontal");
      else fail("mobile overflow");

      await page.getByTestId("mobile-context-back").click();
      await expect(page).toHaveURL(/\/app\/my-leads\?filter=new/);
      pass("mobile: ← Minha fila com filtro");
    } else {
      skip("mobile lead back", "fila vazia");
    }

    await page.goto(`${baseURL}/app/leads/new`);
    await expect(page.getByTestId("mobile-context-back")).toContainText("Leads");
    if (await noOverflow(page)) pass("mobile novo lead: sem overflow");
    else fail("mobile novo lead overflow");

    await logoutViaMore(page);
    await context.close();
  }

  // --- ADMIN: Mais → Usuários → Mais ---
  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await loginAs(page, adminEmail, adminPassword);
    await page.goto(`${baseURL}/admin/users`);
    await expect(page.getByTestId("breadcrumb-link")).toHaveText("Mais");
    await expect(page.getByTestId("breadcrumb-current")).toHaveText("Usuários");
    await page.getByTestId("breadcrumb-link").click();
    await expect(page).toHaveURL(/\/app\/more/);
    pass("Mais → Usuários → Mais");
    await context.close();
  }
} catch (error) {
  fail("fatal", error instanceof Error ? error.message : String(error));
  console.log(`\n=== SMOKE BREADCRUMBS PROD @ ${baseURL} ===`);
  for (const [name, status] of results) {
    console.log(`${status.padEnd(6)} ${name}`);
  }
  await browser.close();
  process.exit(1);
}

await browser.close();

console.log(`\n=== SMOKE BREADCRUMBS PROD @ ${baseURL} ===`);
let failed = 0;
for (const [name, status] of results) {
  console.log(`${status.padEnd(6)} ${name}`);
  if (status.startsWith("FAIL")) failed += 1;
}
console.log(failed === 0 ? "\nOVERALL: PASS" : `\nOVERALL: FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);
