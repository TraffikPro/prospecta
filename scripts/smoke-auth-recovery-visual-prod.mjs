/**
 * Production smoke — Auth Visual Consistency Fatia A (forgot / reset).
 * UI-only; no token secrets logged.
 */
import { chromium, expect } from "@playwright/test";

const baseURL = (
  process.env.SMOKE_BASE_URL || "https://prospecta-ten-tau.vercel.app"
).replace(/\/$/, "");

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(ok ? "PASS" : "FAIL", name, detail);
}

async function measure(page) {
  return page.evaluate(() => {
    const brand = document.querySelector(
      '[data-testid="public-auth-brand-panel"]',
    );
    const mobileBar = document.querySelector(
      '[data-testid="public-auth-mobile-brand-bar"]',
    );
    const visible = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const wordmarks = [
      ...document.querySelectorAll('[data-testid="prospecta-wordmark"]'),
    ].filter(visible);
    const cta =
      document.querySelector('button[type="submit"]') ||
      document.querySelector('a[href="/forgot-password"]');
    const form = document.querySelector("form");
    const card =
      form?.closest(".chakra-card__root") ||
      document.querySelector("h1")?.closest(".chakra-card__root");
    return {
      brandVisible: visible(brand),
      mobileBarVisible: visible(mobileBar),
      visibleWordmarks: wordmarks.length,
      overflow:
        document.documentElement.scrollWidth > window.innerWidth + 1,
      ctaInFold: cta
        ? cta.getBoundingClientRect().bottom <= window.innerHeight
        : false,
      cardW: card ? Math.round(card.getBoundingClientRect().width) : 0,
      h1: document.querySelector("h1")?.textContent?.trim() ?? "",
      hasPipelineLeadLabel: /\bLEAD\b/.test(document.body.innerText),
      tokenInBody: /token=|opaque-audit|eyJ/i.test(document.body.innerText),
    };
  });
}

async function smokePath(browser, label, viewport, path) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  try {
    await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
    const m = await measure(page);
    if (viewport.width >= 1024) {
      record(`${label} brand panel`, m.brandVisible);
      record(`${label} mobile bar hidden`, !m.mobileBarVisible);
    } else {
      record(`${label} brand panel hidden`, !m.brandVisible);
      record(`${label} mobile bar`, m.mobileBarVisible);
      record(
        `${label} single wordmark`,
        m.visibleWordmarks === 1,
        `count=${m.visibleWordmarks}`,
      );
    }
    record(`${label} no PipelineGraphic`, !m.hasPipelineLeadLabel);
    record(`${label} no token in body`, !m.tokenInBody);
    // Desktop targets 440px; mobile is fluid within padded viewport (maxW=440).
    if (viewport.width >= 1024) {
      record(
        `${label} card ~440`,
        m.cardW >= 400 && m.cardW <= 448,
        `w=${m.cardW}`,
      );
    } else {
      record(
        `${label} card fits viewport`,
        m.cardW > 0 && m.cardW <= viewport.width,
        `w=${m.cardW}`,
      );
    }
    record(`${label} CTA first fold`, m.ctaInFold);
    record(`${label} no overflow`, !m.overflow);
    record(`${label} h1 present`, Boolean(m.h1), m.h1);
  } catch (err) {
    record(`${label} suite`, false, String(err));
  } finally {
    await ctx.close();
  }
}

async function main() {
  console.log("SMOKE_BASE_URL", baseURL);
  const browser = await chromium.launch();

  await smokePath(browser, "forgot-d1440", { width: 1440, height: 900 }, "/forgot-password");
  await smokePath(browser, "forgot-m390", { width: 390, height: 844 }, "/forgot-password");
  await smokePath(browser, "reset-d1440", { width: 1440, height: 900 }, "/reset-password");
  await smokePath(browser, "reset-m390", { width: 390, height: 844 }, "/reset-password");

  // Anti-enumeration + missing token message
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await ctx.newPage();
    try {
      await page.goto(`${baseURL}/forgot-password`, {
        waitUntil: "networkidle",
      });
      await page.getByLabel("E-mail", { exact: true }).fill("nobody@prospecta.test");
      await page.getByRole("button", { name: "Enviar" }).click();
      await expect(page.getByTestId("forgot-password-ack")).toHaveText(
        "Se este email estiver cadastrado, enviaremos instruções.",
      );
      record("forgot anti-enumeration ack", true);

      await page.goto(`${baseURL}/reset-password`, {
        waitUntil: "networkidle",
      });
      await expect(
        page.getByText("Link inválido ou expirado.", { exact: true }),
      ).toBeVisible();
      record("reset missing token generic error", true);
    } catch (err) {
      record("recovery states", false, String(err));
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ results, failed: failed.length }, null, 2));
  if (failed.length) process.exit(1);
  console.log("OVERALL PASS");
}

main();
