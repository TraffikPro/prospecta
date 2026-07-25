/**
 * Production smoke — Lead Detail Redesign Fatia A.
 * Credentials from env only — never logged.
 *
 * Required:
 *   SMOKE_BASE_URL (default https://prospecta-ten-tau.vercel.app)
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

const stamp = Date.now();
const company = `Smoke Lead Detail A ${stamp}`;
const leadEmail = `smoke-lda-${stamp}@acme.example`;
const results = [];

function pass(name) {
  results.push([name, "PASS"]);
}
function fail(name, detail) {
  results.push([name, `FAIL ${detail ?? ""}`.trim()]);
}

async function noOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 45_000 });
}

const LEAD_DETAIL_URL = /\/app\/leads\/(?!new(?:\?|$))[^/?]+/;

async function createLeadAndOpen(page) {
  await page.goto(`${baseURL}/app/leads/new`);
  await page.getByLabel("Empresa").fill(company);
  await page.getByLabel("E-mail").fill(leadEmail);
  await page.getByRole("button", { name: "Salvar lead" }).click();
  await page.waitForURL(LEAD_DETAIL_URL, { timeout: 30_000 });
}

const browser = await chromium.launch({ headless: true });

try {
  // —— Desktop 1440×900 ——
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await login(page);
    await createLeadAndOpen(page);

    await expect(page.getByTestId("lead-detail-layout")).toBeVisible();
    await expect(page.locator("[data-page-width='detailWide']")).toBeVisible();
    pass("desktop detailWide + layout");

    const next = page.getByTestId("lead-next-action");
    const contact = page.getByTestId("lead-contact-actions");
    const activity = page.locator("#register-activity");
    const stage = page.getByTestId("move-stage-select");
    await expect(next).toBeVisible();
    await expect(contact).toBeVisible();
    await expect(activity).toBeVisible();
    await expect(stage).toBeVisible();

    const boxes = {
      next: await next.boundingBox(),
      activity: await activity.boundingBox(),
      stage: await stage.boundingBox(),
    };
    if (boxes.next && boxes.activity && boxes.next.x > boxes.activity.x + 40) {
      pass("desktop grid rail à direita");
    } else {
      fail("desktop grid rail à direita", JSON.stringify(boxes));
    }

    const stickyBefore = await page
      .getByTestId("lead-detail-operational-rail")
      .getAttribute("data-sticky");
    pass(`desktop sticky inicial data-sticky=${stickyBefore}`);

    await stage.selectOption("MEETING");
    await expect(stage).toHaveValue("MEETING");

    await page.setViewportSize({ width: 1440, height: 500 });
    await page.waitForTimeout(300);
    const stickyShort = await page
      .getByTestId("lead-detail-operational-rail")
      .getAttribute("data-sticky");
    if (stickyShort === "false") {
      pass("desktop unstick ao reduzir altura");
    } else {
      fail("desktop unstick ao reduzir altura", `data-sticky=${stickyShort}`);
    }

    await expect(stage).toHaveValue("MEETING");
    pass("desktop stage form preserva seleção após unstick");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    await expect(stage).toHaveValue("MEETING");
    pass("desktop stage form preserva seleção ao restaurar viewport");

    await activity.getByLabel("Tipo").selectOption("NOTE");
    await activity.getByLabel("Descrição").fill(`Smoke activity ${stamp}`);
    await activity.getByRole("button", { name: "Salvar atividade" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Contato registrado" }),
    ).toBeVisible({ timeout: 15_000 });
    pass("desktop activity NOTE");

    await expect(
      page.getByLabel("Histórico").getByText(`Smoke activity ${stamp}`),
    ).toBeVisible();
    pass("desktop timeline");

    if (!(await noOverflow(page))) {
      fail("desktop overflow");
    } else {
      pass("desktop sem overflow");
    }

    await page.close();
  }

  // —— Mobile 390×844 + breadcrumb context ——
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await login(page);
    await page.goto(`${baseURL}/app/my-leads?filter=new`);
    await expect(page).toHaveURL(/filter=new/);

    await page.goto(`${baseURL}/app/leads/new`);
    await page.getByLabel("Empresa").fill(`${company} Mobile`);
    await page.getByLabel("E-mail").fill(`m-${leadEmail}`);
    await page.getByRole("button", { name: "Salvar lead" }).click();
    await page.waitForURL(LEAD_DETAIL_URL, { timeout: 30_000 });

    // Re-open with from= for breadcrumb
    const detailUrl = page.url().split("?")[0];
    await page.goto(`${detailUrl}?from=my-leads&filter=new`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("lead-detail-layout")).toBeVisible({
      timeout: 20_000,
    });
    pass("mobile layout");

    const stickyMobile = await page
      .getByTestId("lead-detail-operational-rail")
      .getAttribute("data-sticky");
    if (stickyMobile === "false") {
      pass("mobile sem sticky rail");
    } else {
      fail("mobile sem sticky rail", `data-sticky=${stickyMobile}`);
    }

    const order = await page.evaluate(() => {
      const next = document.querySelector('[data-testid="lead-next-action"]');
      const contact = document.querySelector(
        '[data-testid="lead-contact-actions"]',
      );
      const activity = document.querySelector("#register-activity");
      const stage = document.querySelector('[data-testid="move-stage-select"]');
      const origin = document.querySelector(
        '[data-testid="lead-origin-details"]',
      );
      const ys = [next, contact, activity, stage, origin].map(
        (el) => el?.getBoundingClientRect().top ?? -1,
      );
      for (let i = 1; i < ys.length; i++) {
        if (ys[i] + 1 < ys[i - 1]) return false;
      }
      return true;
    });
    if (order) pass("mobile ordem operacional");
    else fail("mobile ordem operacional");

    await page.getByTestId("move-stage-select").selectOption("CONTACTED");
    await page.getByTestId("move-stage-submit").click();
    await expect(
      page.getByRole("status").filter({ hasText: "Etapa atualizada" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("lead-stage")).toHaveAttribute(
      "data-stage",
      "CONTACTED",
    );
    pass("mobile stage CONTACTED");

    await page.getByRole("link", { name: /Minha fila/i }).first().click();
    await expect(page).toHaveURL(/\/app\/my-leads\?filter=new/);
    pass("mobile breadcrumb ← Minha fila preserva filter");

    if (!(await noOverflow(page))) fail("mobile overflow");
    else pass("mobile sem overflow");

    await page.close();
  }
} catch (error) {
  fail(
    "smoke crashed",
    error instanceof Error ? error.message : String(error),
  );
} finally {
  await browser.close();
}

console.log("\nLead Detail Fatia A — production smoke\n");
for (const [name, status] of results) {
  console.log(`${status.padEnd(6)} ${name}`);
}
const failed = results.some(([, s]) => s.startsWith("FAIL"));
console.log(`\nOVERALL ${failed ? "FAIL" : "PASS"}`);
process.exit(failed ? 1 : 0);
