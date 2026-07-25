/**
 * Validate Lead Detail Density v1 (operational rail).
 *
 * Requires a running app at PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3000)
 * and DATABASE_URL pointing at a mutable local/staging DB (overdue seed via Prisma).
 *
 * Usage:
 *   DATABASE_URL=postgresql://… PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
 *     pnpm exec tsx scripts/validate-lead-detail-density.mjs
 *
 * Credentials: E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD or SEED_MEMBER_PASSWORD.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const email = process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const password =
  process.env.E2E_MEMBER_PASSWORD ??
  process.env.SEED_MEMBER_PASSWORD ??
  "MemberTest123!";
const LEAD_DETAIL_URL = /\/app\/leads\/(?!new(?:\?|$))[^/?]+/;
const outDir = join(
  process.cwd(),
  "docs/product/assets/lead-detail-density-v1-build",
);
mkdirSync(outDir, { recursive: true });

/** Production Fatia A baseline (grill measurements). */
const before = {
  next: 251,
  contact: 133,
  stage: 218,
  stageY: 912,
  railGaps: 48,
};

async function login(page) {
  await page.goto(`${base}/login`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 45_000 });
}

async function createLead(page, company, leadEmail) {
  await page.goto(`${base}/app/leads/new`);
  await page.getByLabel("Empresa").fill(company);
  await page.getByLabel("E-mail").fill(leadEmail);
  await page.getByRole("button", { name: "Salvar lead" }).click();
  await page.waitForURL(LEAD_DETAIL_URL, { timeout: 30_000 });
  return page.url().split("?")[0];
}

async function measureRail(page) {
  await expect(page.getByTestId("lead-detail-layout")).toBeVisible();
  await page.waitForTimeout(300);
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
    const next = box(document.querySelector('[data-testid="lead-next-action"]'));
    const contact = box(
      document.querySelector('[data-testid="lead-contact-actions"]'),
    );
    const stageHeading = document.querySelector("#move-stage-heading");
    const stageSelect = document.querySelector(
      '[data-testid="move-stage-select"]',
    );
    const stageCard =
      stageHeading?.closest(".chakra-card__root") ||
      stageHeading?.closest("[class*='card']") ||
      stageSelect?.closest(".chakra-card__root");
    const stage = box(stageCard);
    const headingBox = box(stageHeading);
    const selectBox = box(stageSelect);
    const vh = window.innerHeight;
    const overdueVisible = Boolean(
      Array.from(
        document.querySelectorAll('[data-testid="lead-next-action"] *'),
      ).some((n) => (n.textContent || "").includes("Follow-up atrasado")),
    );
    return {
      vh,
      next,
      contact,
      stage,
      stageHeading: headingBox,
      stageSelect: selectBox,
      headingInFold: headingBox ? headingBox.bottom <= vh : false,
      selectInFold: selectBox ? selectBox.bottom <= vh : false,
      sticky: document
        .querySelector('[data-testid="lead-detail-operational-rail"]')
        ?.getAttribute("data-sticky"),
      overdueVisible,
      followUpState: document
        .querySelector('[data-testid="lead-next-action"]')
        ?.getAttribute("data-follow-up-state"),
    };
  });
}

/** Readability probes for compact Next Action (truncation / collision / zoom). */
async function probeNextActionReadability(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-testid="lead-next-action"]');
    if (!root) return { ok: false, reason: "missing next action" };

    const targets = [
      ["status", '[data-testid="next-action-status"]'],
      ["followUp", '[data-testid="next-action-follow-up"]'],
      ["recommended", '[data-testid="next-action-recommended"]'],
    ];

    const issues = [];
    for (const [name, sel] of targets) {
      const el = root.querySelector(sel);
      if (!el) {
        issues.push(`${name}: missing`);
        continue;
      }
      const style = getComputedStyle(el);
      if (style.textOverflow === "ellipsis" || style.webkitLineClamp !== "none") {
        issues.push(`${name}: truncation style`);
      }
      if (el.scrollWidth > el.clientWidth + 1) {
        issues.push(`${name}: horizontal clip (${el.scrollWidth}>${el.clientWidth})`);
      }
      if (!(el.textContent || "").trim()) {
        issues.push(`${name}: empty`);
      }
    }

    // Long copy stress: inject longest known labels + long date.
    const status = root.querySelector('[data-testid="next-action-status"]');
    const follow = root.querySelector('[data-testid="next-action-follow-up"]');
    const action = root.querySelector('[data-testid="next-action-recommended"]');
    if (status) status.textContent = "Enviado sem resposta";
    if (follow) follow.textContent = "24/07/2026, 21:45";
    if (action) {
      action.textContent = "Definir próximo passo ou encerrar";
    }

    for (const [name, sel] of targets) {
      const el = root.querySelector(sel);
      if (!el) continue;
      if (el.scrollWidth > el.clientWidth + 1) {
        issues.push(`${name}: long-copy horizontal clip`);
      }
    }

    const labels = Array.from(root.querySelectorAll("p, h2")).map((n) =>
      (n.textContent || "").trim(),
    );
    const hasStatusLabel = labels.some((t) => t === "Status atual");
    const hasFollowLabel = labels.some((t) => t === "Follow-up");
    const hasActionLabel = labels.some((t) => t === "Ação recomendada");
    if (!hasStatusLabel || !hasFollowLabel || !hasActionLabel) {
      issues.push("ambiguous: missing field labels");
    }

    return { ok: issues.length === 0, issues, labels };
  });
}

const stamp = Date.now();
const browser = await chromium.launch();
const report = { before, after: {}, checks: [], readability: null };

function check(name, ok, detail = "") {
  report.checks.push({ name, ok, detail });
  console.log(ok ? "PASS" : "FAIL", name, detail);
}

try {
  // Desktop normal
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await login(page);
    const url = await createLead(
      page,
      `Density Build ${stamp}`,
      `density-build-${stamp}@acme.example`,
    );
    const m = await measureRail(page);
    report.after.desktop_normal = m;
    await page.screenshot({
      path: join(outDir, "desktop-1440x900-normal.png"),
      fullPage: false,
    });
    check(
      "desktop normal: heading+select na dobra",
      m.headingInFold && m.selectInFold,
      JSON.stringify({
        heading: m.stageHeading,
        select: m.stageSelect,
        nextH: m.next?.h,
        contactH: m.contact?.h,
        stageH: m.stage?.h,
      }),
    );

    const readability = await probeNextActionReadability(page);
    report.readability = { at100: readability };
    check(
      "next action readability (labels + long copy)",
      readability.ok,
      JSON.stringify(readability.issues || readability.reason),
    );

    // 200% zoom — layout CSS zoom (Chromium)
    await page.evaluate(() => {
      document.documentElement.style.zoom = "200%";
    });
    await page.waitForTimeout(200);
    const readabilityZoom = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="lead-next-action"]');
      if (!root) return { ok: false, reason: "missing" };
      const issues = [];
      for (const sel of [
        '[data-testid="next-action-status"]',
        '[data-testid="next-action-follow-up"]',
        '[data-testid="next-action-recommended"]',
      ]) {
        const el = root.querySelector(sel);
        if (!el) {
          issues.push(`${sel}: missing`);
          continue;
        }
        if (el.scrollWidth > el.clientWidth + 1) {
          issues.push(`${sel}: clip at 200%`);
        }
        const style = getComputedStyle(el);
        if (Number.parseFloat(style.fontSize) < 10) {
          issues.push(`${sel}: font too small at 200% (${style.fontSize})`);
        }
      }
      // Alert must keep title text (not color-only).
      const alertTitle = root.querySelector(".chakra-alert__title");
      if (alertTitle && !(alertTitle.textContent || "").trim()) {
        issues.push("alert: empty title");
      }
      return { ok: issues.length === 0, issues };
    });
    report.readability.at200 = readabilityZoom;
    await page.screenshot({
      path: join(outDir, "desktop-1440x900-next-action-zoom-200.png"),
      fullPage: false,
    });
    check(
      "next action readability @200% zoom",
      readabilityZoom.ok,
      JSON.stringify(readabilityZoom.issues || readabilityZoom.reason),
    );
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });

    // sticky unstick preserves selection
    await page.getByTestId("move-stage-select").selectOption("MEETING");
    // Denser rail fits mid heights; drop further so groupH + stickyTop exceeds viewport.
    await page.setViewportSize({ width: 1440, height: 320 });
    await page.waitForTimeout(250);
    const stickyShort = await page
      .getByTestId("lead-detail-operational-rail")
      .getAttribute("data-sticky");
    const valueShort = await page.getByTestId("move-stage-select").inputValue();
    check("unstick ao reduzir altura", stickyShort === "false", stickyShort);
    check("seleção preservada no unstick", valueShort === "MEETING", valueShort);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(250);
    check(
      "seleção preservada ao restaurar",
      (await page.getByTestId("move-stage-select").inputValue()) === "MEETING",
    );

    // LOST lostReason
    await page.getByTestId("move-stage-select").selectOption("LOST");
    await expect(page.getByTestId("lost-reason")).toBeVisible();
    check("LOST mostra lostReason", true);

    // Overdue via prisma
    const prisma = new PrismaClient();
    const leadId = url.split("/").pop();
    const owner = await prisma.user.findUnique({ where: { email } });
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await prisma.activity.create({
      data: {
        leadId,
        authorId: owner.id,
        type: "WHATSAPP",
        outcome: "SENT_NO_REPLY",
        body: "Overdue seed for density build",
      },
    });
    await prisma.lead.update({
      where: { id: leadId },
      data: { nextFollowUpAt: past, stage: "CONTACTED" },
    });
    await prisma.$disconnect();

    await page.reload({ waitUntil: "domcontentloaded" });
    const overdue = await measureRail(page);
    report.after.desktop_overdue = overdue;
    await page.screenshot({
      path: join(outDir, "desktop-1440x900-overdue.png"),
      fullPage: false,
    });
    check(
      "overdue alerta completo",
      overdue.overdueVisible && overdue.followUpState === "overdue",
      overdue.followUpState,
    );

    // Overdue alert is not color-only (explicit title text; icon optional).
    const overdueA11y = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="lead-next-action"]');
      const title =
        root?.querySelector("[data-part='title']") ||
        root?.querySelector(".chakra-alert__title");
      const text = (title?.textContent || "").trim();
      const hasText = text.toLowerCase().includes("atrasado");
      const hasIcon = Boolean(
        root?.querySelector("svg") ||
          root?.querySelector("[data-part='indicator']"),
      );
      return { ok: hasText, text, hasIcon };
    });
    check(
      "overdue não depende só de cor",
      overdueA11y.ok,
      JSON.stringify(overdueA11y),
    );
    await page.close();
  }

  // Mobile
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await login(page);
    await createLead(
      page,
      `Density Mobile Build ${stamp}`,
      `density-m-build-${stamp}@acme.example`,
    );
    const m = await measureRail(page);
    report.after.mobile = m;
    await page.screenshot({
      path: join(outDir, "mobile-390x844.png"),
      fullPage: false,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    check("mobile sem overflow", !overflow);
    check("mobile sticky=false", m.sticky === "false", m.sticky);
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
    check("mobile ordem preservada", orderOk);
    await page.close();
  }
} finally {
  await browser.close();
}

const deltas = {
  nextH: {
    before: before.next,
    after: report.after.desktop_normal?.next?.h,
  },
  contactH: {
    before: before.contact,
    after: report.after.desktop_normal?.contact?.h,
  },
  stageH: {
    before: before.stage,
    after: report.after.desktop_normal?.stage?.h,
  },
  stageY: {
    before: before.stageY,
    after: report.after.desktop_normal?.stage?.y,
  },
};
report.deltas = deltas;
writeFileSync(
  join(outDir, "validation.json"),
  JSON.stringify(report, null, 2),
);
console.log("\nDeltas", JSON.stringify(deltas, null, 2));
const failed = report.checks.some((c) => !c.ok);
console.log(`\nOVERALL ${failed ? "FAIL" : "PASS"}`);
process.exit(failed ? 1 : 0);
