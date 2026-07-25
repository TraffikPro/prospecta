/**
 * Production density measurements for Lead Detail Density grill.
 * Credentials from env only — never logged.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

if (!password) {
  console.error("Missing smoke member password in env");
  process.exit(1);
}

const outDir = join(
  process.cwd(),
  "docs/product/assets/lead-detail-density-v1",
);
mkdirSync(outDir, { recursive: true });

const stamp = Date.now();
const LEAD_DETAIL_URL = /\/app\/leads\/(?!new(?:\?|$))[^/?]+/;

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  try {
    await page.waitForURL(/\/app(\/|$)/, { timeout: 45_000 });
  } catch (error) {
    const url = page.url();
    const alert = await page
      .getByRole("alert")
      .first()
      .innerText()
      .catch(() => "(none)");
    throw new Error(
      `login failed url=${url} alert=${alert} cause=${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function createLead(page, company, leadEmail) {
  await page.goto(`${baseURL}/app/leads/new`);
  await page.getByLabel("Empresa").fill(company);
  await page.getByLabel("E-mail").fill(leadEmail);
  await page.getByRole("button", { name: "Salvar lead" }).click();
  try {
    await page.waitForURL(LEAD_DETAIL_URL, { timeout: 30_000 });
  } catch (error) {
    const alert = await page
      .getByRole("alert")
      .first()
      .innerText()
      .catch(() => "(none)");
    throw new Error(
      `create lead failed url=${page.url()} alert=${alert} cause=${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return page.url().split("?")[0];
}

async function measure(page, label) {
  await expect(page.getByTestId("lead-detail-layout")).toBeVisible({
    timeout: 20_000,
  });
  await page.waitForTimeout(400);

  const metrics = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        h: Math.round(r.height),
        y: Math.round(r.top),
        bottom: Math.round(r.bottom),
        x: Math.round(r.left),
      };
    };
    const textLen = (sel) => {
      const el = document.querySelector(sel);
      return el ? (el.innerText || "").trim().length : 0;
    };
    const vh = window.innerHeight;
    const next = box('[data-testid="lead-next-action"]');
    const contact = box('[data-testid="lead-contact-actions"]');
    const stage = box('[data-testid="move-stage-select"]')?.h
      ? (() => {
          const form = document
            .querySelector('[data-testid="move-stage-select"]')
            ?.closest(".chakra-card__root, [class*='card']");
          const el =
            form ||
            document
              .querySelector("#move-stage-heading")
              ?.closest("section, form, div");
          if (!el) return box('[data-testid="move-stage-select"]');
          const r = el.getBoundingClientRect();
          return {
            h: Math.round(r.height),
            y: Math.round(r.top),
            bottom: Math.round(r.bottom),
            x: Math.round(r.left),
          };
        })()
      : null;
    const header = box('[data-testid="lead-info-list"]')
      ? (() => {
          const list = document.querySelector('[data-testid="lead-info-list"]');
          const card = list?.closest(".chakra-card__root, [class*='card']");
          const el = card || list;
          const r = el.getBoundingClientRect();
          return {
            h: Math.round(r.height),
            y: Math.round(r.top),
            bottom: Math.round(r.bottom),
          };
        })()
      : null;
    const activity = box("#register-activity");
    const intel = box('[data-testid="lead-intelligence-card"]');
    const history = box('[data-testid="activity-timeline"]');
    const origin = box('[data-testid="lead-origin-details"]');
    const rail = document.querySelector(
      '[data-testid="lead-detail-operational-rail"]',
    );
    const sticky = rail?.getAttribute("data-sticky") ?? null;

    const stageInFirstFold = stage ? stage.bottom <= vh : false;
    const contactInFirstFold = contact ? contact.bottom <= vh : false;
    const nextInFirstFold = next ? next.bottom <= vh : false;

    const railStackH =
      (next?.h ?? 0) +
      (contact?.h ?? 0) +
      (stage?.h ?? 0) +
      24 * 2; /* approx gap */

    return {
      viewport: { w: window.innerWidth, h: vh },
      sticky,
      header,
      next,
      contact,
      stage,
      activity,
      intel,
      history,
      origin,
      nextInFirstFold,
      contactInFirstFold,
      stageInFirstFold,
      railStackApproxH: railStackH,
      contactTextLen: textLen('[data-testid="lead-contact-actions"]'),
      nextTextLen: textLen('[data-testid="lead-next-action"]'),
      headerTextLen: textLen('[data-testid="lead-info-list"]'),
      timelineItems: document.querySelectorAll(
        '[data-testid="activity-timeline"] [role="listitem"], [data-testid="activity-timeline"] li',
      ).length,
    };
  });

  // Prefer measuring MoveStageForm card via heading
  const stageCard = page.locator("#move-stage-heading").locator("xpath=ancestor::*[contains(@class,'chakra-card') or self::section][1]");
  if (await stageCard.count()) {
    const sb = await stageCard.boundingBox();
    if (sb) {
      metrics.stage = {
        h: Math.round(sb.height),
        y: Math.round(sb.y),
        bottom: Math.round(sb.y + sb.height),
        x: Math.round(sb.x),
      };
      metrics.stageInFirstFold = metrics.stage.bottom <= metrics.viewport.h;
      metrics.railStackApproxH =
        (metrics.next?.h ?? 0) +
        (metrics.contact?.h ?? 0) +
        metrics.stage.h +
        48;
    }
  }

  const shot = join(outDir, `${label}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  metrics.screenshot = shot.replace(/\\/g, "/");
  return metrics;
}

const browser = await chromium.launch({ headless: true });
const report = {
  capturedAt: new Date().toISOString(),
  baseURL,
  commitHint: "production tip pós Fatia A DONE",
  scenarios: {},
};

try {
  // Desktop — lead sem Activity
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await login(page);
    const url = await createLead(
      page,
      `Density New ${stamp}`,
      `density-new-${stamp}@acme.example`,
    );
    report.scenarios.desktop_no_activity = await measure(
      page,
      "desktop-1440x900-no-activity",
    );
    report.scenarios.desktop_no_activity.leadUrl = url;

    // Same lead — with Activity + history
    const form = page.locator("#register-activity");
    await form.getByLabel("Tipo").selectOption("NOTE");
    await form.getByLabel("Descrição").fill(`Density history note ${stamp}`);
    await form.getByRole("button", { name: "Salvar atividade" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Contato registrado" }),
    ).toBeVisible({ timeout: 15_000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    report.scenarios.desktop_with_history = await measure(
      page,
      "desktop-1440x900-with-history",
    );
    report.scenarios.desktop_with_history.leadUrl = url;
    await page.close();
  }

  // Mobile — lead sem Activity
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await login(page);
    const url = await createLead(
      page,
      `Density Mobile ${stamp}`,
      `density-m-${stamp}@acme.example`,
    );
    report.scenarios.mobile_no_activity = await measure(
      page,
      "mobile-390x844-no-activity",
    );
    report.scenarios.mobile_no_activity.leadUrl = url;
    await page.close();
  }
} finally {
  await browser.close();
}

const jsonPath = join(outDir, "measurements.json");
writeFileSync(jsonPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`\nWrote ${jsonPath}`);
