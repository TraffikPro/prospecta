/**
 * Production smoke — Lead Detail Density v1 (rail fold meta).
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
const results = [];

function pass(name, detail = "") {
  results.push([name, "PASS", detail]);
  console.log("PASS", name, detail);
}
function fail(name, detail = "") {
  results.push([name, "FAIL", detail]);
  console.log("FAIL", name, detail);
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 45_000 });
}

const LEAD_DETAIL_URL = /\/app\/leads\/(?!new(?:\?|$))[^/?]+/;

async function createLead(page, company, leadEmail) {
  await page.goto(`${baseURL}/app/leads/new`);
  await page.getByLabel("Empresa").fill(company);
  await page.getByLabel("E-mail").fill(leadEmail);
  await page.getByRole("button", { name: "Salvar lead" }).click();
  await page.waitForURL(LEAD_DETAIL_URL, { timeout: 30_000 });
}

async function measureFold(page) {
  return page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        h: Math.round(r.height),
        y: Math.round(r.top),
        bottom: Math.round(r.bottom),
      };
    };
    const heading = box(document.querySelector("#move-stage-heading"));
    const select = box(
      document.querySelector('[data-testid="move-stage-select"]'),
    );
    const next = box(document.querySelector('[data-testid="lead-next-action"]'));
    const contact = box(
      document.querySelector('[data-testid="lead-contact-actions"]'),
    );
    const vh = window.innerHeight;
    return {
      vh,
      heading,
      select,
      nextH: next?.h,
      contactH: contact?.h,
      headingInFold: heading ? heading.bottom <= vh : false,
      selectInFold: select ? select.bottom <= vh : false,
      sticky: document
        .querySelector('[data-testid="lead-detail-operational-rail"]')
        ?.getAttribute("data-sticky"),
    };
  });
}

const browser = await chromium.launch({ headless: true });

try {
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await login(page);
    await createLead(
      page,
      `Smoke Density ${stamp}`,
      `smoke-density-${stamp}@acme.example`,
    );
    await expect(page.getByTestId("lead-detail-layout")).toBeVisible();

    const fold = await measureFold(page);
    if (fold.headingInFold && fold.selectInFold) {
      pass(
        "desktop normal: heading+select na dobra",
        JSON.stringify({
          headingBottom: fold.heading?.bottom,
          selectBottom: fold.select?.bottom,
          nextH: fold.nextH,
          contactH: fold.contactH,
        }),
      );
    } else {
      fail(
        "desktop normal: heading+select na dobra",
        JSON.stringify(fold),
      );
    }

    await page.getByTestId("move-stage-select").selectOption("MEETING");
    await page.setViewportSize({ width: 1440, height: 320 });
    await page.waitForTimeout(300);
    const stickyShort = await page
      .getByTestId("lead-detail-operational-rail")
      .getAttribute("data-sticky");
    const valueShort = await page.getByTestId("move-stage-select").inputValue();
    if (stickyShort === "false") pass("unstick ao reduzir altura");
    else fail("unstick ao reduzir altura", stickyShort);
    if (valueShort === "MEETING") pass("seleção preservada no unstick");
    else fail("seleção preservada no unstick", valueShort);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);
    if ((await page.getByTestId("move-stage-select").inputValue()) === "MEETING") {
      pass("seleção preservada ao restaurar");
    } else {
      fail("seleção preservada ao restaurar");
    }

    await page.getByTestId("move-stage-select").selectOption("LOST");
    await expect(page.getByTestId("lost-reason")).toBeVisible();
    pass("LOST mostra lostReason");

    // Overdue via UI: register SENT_NO_REPLY with past follow-up if possible.
    await page.locator("#register-activity").scrollIntoViewIfNeeded();
    await page.getByLabel("Tipo").selectOption("WHATSAPP");
    await page.getByLabel("Resultado", { exact: true }).selectOption("SENT_NO_REPLY");
    await page.getByLabel("Descrição").fill("Smoke density overdue seed");
    // Past datetime for follow-up (local input).
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    const local = `${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}T${pad(past.getHours())}:${pad(past.getMinutes())}`;
    await page.getByLabel(/Próximo passo/).fill(local);
    await page.getByRole("button", { name: "Salvar atividade" }).click();
    await page.waitForTimeout(800);
    await page.reload({ waitUntil: "domcontentloaded" });
    const overdueState = await page
      .getByTestId("lead-next-action")
      .getAttribute("data-follow-up-state");
    const overdueText = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('[data-testid="lead-next-action"] *'),
      ).some((n) => (n.textContent || "").includes("Follow-up atrasado")),
    );
    if (overdueState === "overdue" && overdueText) {
      pass("overdue alerta completo", overdueState);
    } else {
      fail("overdue alerta completo", `${overdueState} text=${overdueText}`);
    }

    await page.close();
  }

  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await login(page);
    await createLead(
      page,
      `Smoke Density M ${stamp}`,
      `smoke-density-m-${stamp}@acme.example`,
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    if (!overflow) pass("mobile sem overflow");
    else fail("mobile sem overflow");

    const sticky = await page
      .getByTestId("lead-detail-operational-rail")
      .getAttribute("data-sticky");
    if (sticky === "false") pass("mobile sticky=false");
    else fail("mobile sticky=false", sticky);

    const orderOk = await page.evaluate(() => {
      const ys = [
        '[data-testid="lead-next-action"]',
        '[data-testid="lead-contact-actions"]',
        "#register-activity",
        "#move-stage-heading",
      ].map((s) => document.querySelector(s)?.getBoundingClientRect().top ?? -1);
      for (let i = 1; i < ys.length; i++) {
        if (ys[i] + 1 < ys[i - 1]) return false;
      }
      return true;
    });
    if (orderOk) pass("mobile ordem preservada");
    else fail("mobile ordem preservada");
    await page.close();
  }
} finally {
  await browser.close();
}

const failed = results.some(([, status]) => status === "FAIL");
console.log(`\nOVERALL ${failed ? "FAIL" : "PASS"}`);
process.exit(failed ? 1 : 0);
