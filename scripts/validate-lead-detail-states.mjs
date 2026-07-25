/**
 * Local validation — Lead Detail Fatia C (empty + terminal states).
 *
 * Requires app at PLAYWRIGHT_BASE_URL and mutable DATABASE_URL.
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
  "docs/product/assets/lead-detail-states-v1-build",
);
mkdirSync(outDir, { recursive: true });

const report = { checks: [], matrix: {} };

function check(name, ok, detail = "") {
  report.checks.push({ name, ok, detail });
  console.log(ok ? "PASS" : "FAIL", name, detail);
}

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

function leadIdFromUrl(url) {
  return url.split("/").pop();
}

const stamp = Date.now();
const browser = await chromium.launch();
const prisma = new PrismaClient();

try {
  const owner = await prisma.user.findUnique({ where: { email } });
  if (!owner) throw new Error("seed member missing");

  // —— Desktop scenarios ——
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await login(page);

    // 1) no activity + no follow-up + MANUAL no intelligence
    const urlOpen = await createLead(
      page,
      `States Open ${stamp}`,
      `states-open-${stamp}@acme.example`,
    );
    const idOpen = leadIdFromUrl(urlOpen);
    await expect(page.getByTestId("activity-timeline-empty")).toBeVisible();
    await expect(
      page.getByTestId("activity-timeline-empty").getByRole("link", {
        name: "Registrar atividade",
      }),
    ).toHaveAttribute("href", "#register-activity");
    check("sem Activity empty compact", true);

    await expect(page.getByTestId("next-action-follow-up")).toHaveText(
      "Não definido",
    );
    await expect(page.getByTestId("next-action-follow-up-guidance")).toBeVisible();
    check("aberto sem próximo passo", true);

    await expect(page.getByTestId("lead-intelligence-fallback")).toBeVisible();
    await expect(page.getByTestId("lead-intelligence-fallback")).toContainText(
      "Inteligência não disponível",
    );
    await expect(page.getByTestId("lead-intelligence-fallback")).toContainText(
      "Lead cadastrado manualmente",
    );
    check("MANUAL sem Intelligence", true);

    await page.screenshot({
      path: join(outDir, "desktop-no-activity-manual.png"),
      fullPage: false,
    });
    report.matrix.no_activity_manual = "PASS";

    // 2) no phone/email
    await prisma.lead.update({
      where: { id: idOpen },
      data: { email: null, phone: null },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("lead-contact-unavailable")).toBeVisible();
    await expect(page.getByTestId("lead-contact-unavailable")).toContainText(
      "Contato indisponível",
    );
    await expect(
      page.getByTestId("lead-contact-actions").getByRole("link", {
        name: "Editar",
      }),
    ).toHaveCount(0);
    const registerActivityLink = page
      .getByTestId("lead-contact-actions")
      .getByRole("link", { name: "Registrar atividade" });
    await expect(registerActivityLink).toBeVisible();
    await expect(registerActivityLink).toHaveAttribute(
      "href",
      "#register-activity",
    );
    await expect(
      page.getByTestId("lead-contact-actions").getByRole("link", {
        name: "Registrar resultado",
      }),
    ).toHaveCount(0);

    // Anchor: scroll + focusable target for keyboard / in-page navigation
    await registerActivityLink.click();
    await page.waitForTimeout(250);
    const anchorOk = await page.evaluate(() => {
      const target = document.querySelector("#register-activity");
      if (!(target instanceof HTMLElement)) {
        return { ok: false, reason: "missing target" };
      }
      const r = target.getBoundingClientRect();
      const inView = r.top < window.innerHeight && r.bottom > 0;
      const focusable = target.tabIndex === -1 || target.tabIndex >= 0;
      target.focus();
      const hasFocus = document.activeElement === target;
      return {
        ok:
          inView &&
          window.location.hash === "#register-activity" &&
          focusable &&
          hasFocus,
        hash: window.location.hash,
        top: Math.round(r.top),
        tabIndex: target.tabIndex,
        hasFocus,
      };
    });
    check(
      "sem canal: CTA Registrar atividade + scroll/foco #register-activity",
      anchorOk.ok,
      JSON.stringify(anchorOk),
    );
    await page.screenshot({
      path: join(outDir, "desktop-no-contact-channel.png"),
      fullPage: false,
    });
    report.matrix.no_contact = "PASS";

    // restore email for further use
    await prisma.lead.update({
      where: { id: idOpen },
      data: { email: `states-open-${stamp}@acme.example` },
    });

    // 3) WON with residual overdue follow-up
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await prisma.lead.update({
      where: { id: idOpen },
      data: { stage: "WON", nextFollowUpAt: past },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    const wonTerminal = await page
      .getByTestId("lead-next-action")
      .getAttribute("data-terminal");
    const wonAlert = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('[data-testid="lead-next-action"] *'),
      ).some((n) =>
        /Follow-up (hoje|atrasado)/i.test(n.textContent || ""),
      ),
    );
    const wonFuKept = await prisma.lead.findUnique({
      where: { id: idOpen },
      select: { nextFollowUpAt: true },
    });
    check("WON terminal flag", wonTerminal === "true", wonTerminal);
    check("WON sem urgência residual", !wonAlert);
    check(
      "WON preserva nextFollowUpAt",
      Boolean(wonFuKept?.nextFollowUpAt),
    );
    await page.screenshot({
      path: join(outDir, "desktop-won-residual-fu.png"),
      fullPage: false,
    });
    report.matrix.won_residual = "PASS";

    // 4) LOST with residual due_today
    const today = new Date();
    await prisma.lead.update({
      where: { id: idOpen },
      data: { stage: "LOST", nextFollowUpAt: today },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    const lostAlert = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('[data-testid="lead-next-action"] *'),
      ).some((n) =>
        /Follow-up (hoje|atrasado)/i.test(n.textContent || ""),
      ),
    );
    check("LOST sem urgência residual", !lostAlert);
    await expect(page.getByTestId("lead-next-action")).toHaveAttribute(
      "data-terminal",
      "true",
    );
    await page.screenshot({
      path: join(outDir, "desktop-lost-residual-fu.png"),
      fullPage: false,
    });
    report.matrix.lost_residual = "PASS";

    // 5) GOOGLE_PLACES without intelligence
    const urlPlaces = await createLead(
      page,
      `States Places ${stamp}`,
      `states-places-${stamp}@acme.example`,
    );
    const idPlaces = leadIdFromUrl(urlPlaces);
    await prisma.lead.update({
      where: { id: idPlaces },
      data: { source: "GOOGLE_PLACES", intelligence: null },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("lead-intelligence-fallback")).toBeVisible();
    await expect(page.getByTestId("lead-intelligence-fallback")).toContainText(
      "Inteligência não disponível",
    );
    const placesText = await page.getByTestId("lead-intelligence-fallback").innerText();
    check(
      "GOOGLE_PLACES sem Intelligence (sem linha Manual)",
      placesText.includes("Inteligência não disponível") &&
        !placesText.includes("Lead cadastrado manualmente"),
    );
    await page.screenshot({
      path: join(outDir, "desktop-places-no-intelligence.png"),
      fullPage: false,
    });
    report.matrix.places_no_intel = "PASS";

    // 6) open due_today
    const urlDue = await createLead(
      page,
      `States Due ${stamp}`,
      `states-due-${stamp}@acme.example`,
    );
    const idDue = leadIdFromUrl(urlDue);
    await prisma.activity.create({
      data: {
        leadId: idDue,
        authorId: owner.id,
        type: "WHATSAPP",
        outcome: "SENT_NO_REPLY",
        body: "due today seed",
      },
    });
    await prisma.lead.update({
      where: { id: idDue },
      data: { stage: "CONTACTED", nextFollowUpAt: new Date() },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("lead-next-action")).toHaveAttribute(
      "data-follow-up-state",
      "due_today",
    );
    await expect(page.getByText("Follow-up hoje")).toBeVisible();
    check("follow-up hoje aberto", true);
    await page.screenshot({
      path: join(outDir, "desktop-due-today.png"),
      fullPage: false,
    });
    report.matrix.due_today = "PASS";

    // 7) open overdue
    await prisma.lead.update({
      where: { id: idDue },
      data: { nextFollowUpAt: past },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("lead-next-action")).toHaveAttribute(
      "data-follow-up-state",
      "overdue",
    );
    await expect(page.getByText("Follow-up atrasado")).toBeVisible();
    check("follow-up atrasado aberto", true);
    await page.screenshot({
      path: join(outDir, "desktop-overdue.png"),
      fullPage: false,
    });
    report.matrix.overdue = "PASS";

    // 8) zoom 200% — open no FU
    await page.goto(urlOpen);
    await page.evaluate(() => {
      document.documentElement.style.zoom = "200%";
    });
    await page.waitForTimeout(200);
    const zoomOk = await page.evaluate(() => {
      const empty = document.querySelector(
        '[data-testid="activity-timeline-empty"]',
      );
      const intel = document.querySelector(
        '[data-testid="lead-intelligence-fallback"]',
      );
      return Boolean(empty && intel);
    });
    check("zoom 200% empty/intel legíveis", zoomOk);
    await page.screenshot({
      path: join(outDir, "desktop-zoom-200.png"),
      fullPage: false,
    });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });

    await page.close();
  }

  // —— Mobile ——
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await login(page);
    await createLead(
      page,
      `States Mobile ${stamp}`,
      `states-m-${stamp}@acme.example`,
    );
    await expect(page.getByTestId("activity-timeline-empty")).toBeVisible();
    await expect(page.getByTestId("lead-intelligence-fallback")).toBeVisible();
    await expect(page.getByTestId("next-action-follow-up")).toHaveText(
      "Não definido",
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    check("mobile sem overflow", !overflow);
    const orderOk = await page.evaluate(() => {
      const ys = [
        '[data-testid="lead-next-action"]',
        '[data-testid="lead-contact-actions"]',
        "#register-activity",
        "#history-heading",
      ].map((s) => document.querySelector(s)?.getBoundingClientRect().top ?? -1);
      for (let i = 1; i < ys.length; i++) {
        if (ys[i] + 1 < ys[i - 1]) return false;
      }
      return true;
    });
    check("mobile ordem preservada", orderOk);
    await page.screenshot({
      path: join(outDir, "mobile-390x844.png"),
      fullPage: false,
    });
    report.matrix.mobile = "PASS";
    await page.close();
  }
} finally {
  await prisma.$disconnect();
  await browser.close();
}

writeFileSync(join(outDir, "validation.json"), JSON.stringify(report, null, 2));
const failed = report.checks.some((c) => !c.ok);
console.log(`\nOVERALL ${failed ? "FAIL" : "PASS"}`);
process.exit(failed ? 1 : 0);
