/**
 * Production smoke — Lead Detail Fatia C (critical empty + terminal states).
 * Credentials from env only — never logged.
 *
 * Required:
 *   SMOKE_BASE_URL (default https://prospecta-ten-tau.vercel.app)
 *   SMOKE_MEMBER_PASSWORD / E2E_MEMBER_PASSWORD / SEED_MEMBER_PASSWORD
 *   DATABASE_URL (mutable DB behind that deploy — for residual FU / no-channel seeds)
 */
import { chromium, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

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
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL for residual-state seeds");
  process.exit(1);
}

const stamp = Date.now();
const results = [];
const LEAD_DETAIL_URL = /\/app\/leads\/(?!new(?:\?|$))[^/?]+/;

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

async function createLead(page, company, leadEmail) {
  await page.goto(`${baseURL}/app/leads/new`);
  await page.getByLabel("Empresa").fill(company);
  await page.getByLabel("E-mail").fill(leadEmail);
  await page.getByRole("button", { name: "Salvar lead" }).click();
  await page.waitForURL(LEAD_DETAIL_URL, { timeout: 30_000 });
  return page.url().split("?")[0];
}

function leadIdFromUrl(url) {
  return url.split("/").pop();
}

const browser = await chromium.launch({ headless: true });
const prisma = new PrismaClient();

try {
  const owner = await prisma.user.findUnique({ where: { email } });
  if (!owner) throw new Error("smoke member not found in DATABASE_URL");

  // Desktop critical states
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await login(page);

    const url = await createLead(
      page,
      `Smoke States ${stamp}`,
      `smoke-states-${stamp}@acme.example`,
    );
    const leadId = leadIdFromUrl(url);

    // 1) sem Activity + MANUAL sem Intelligence
    try {
      await expect(page.getByTestId("activity-timeline-empty")).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        page.getByTestId("activity-timeline-empty").getByRole("link", {
          name: "Registrar atividade",
        }),
      ).toHaveAttribute("href", "#register-activity");
      pass("sem Activity");
    } catch (e) {
      fail("sem Activity", String(e.message || e));
    }

    try {
      await expect(page.getByTestId("lead-intelligence-fallback")).toBeVisible();
      await expect(page.getByTestId("lead-intelligence-fallback")).toContainText(
        "Inteligência não disponível",
      );
      await expect(page.getByTestId("lead-intelligence-fallback")).toContainText(
        "Lead cadastrado manualmente",
      );
      pass("MANUAL sem Intelligence");
    } catch (e) {
      fail("MANUAL sem Intelligence", String(e.message || e));
    }

    // 2) sem canal → Registrar atividade + scroll/foco
    await prisma.lead.update({
      where: { id: leadId },
      data: { email: null, phone: null },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    try {
      await expect(page.getByTestId("lead-contact-unavailable")).toBeVisible();
      const link = page
        .getByTestId("lead-contact-actions")
        .getByRole("link", { name: "Registrar atividade" });
      await expect(link).toHaveAttribute("href", "#register-activity");
      await expect(
        page.getByTestId("lead-contact-actions").getByRole("link", {
          name: "Registrar resultado",
        }),
      ).toHaveCount(0);
      await link.click();
      await page.waitForTimeout(300);
      const anchor = await page.evaluate(() => {
        const el = document.querySelector("#register-activity");
        if (!(el instanceof HTMLElement)) return { ok: false };
        const r = el.getBoundingClientRect();
        el.focus();
        return {
          ok:
            window.location.hash === "#register-activity" &&
            r.top < window.innerHeight &&
            document.activeElement === el,
        };
      });
      if (anchor.ok) pass("sem canal + anchor scroll/foco");
      else fail("sem canal + anchor scroll/foco", JSON.stringify(anchor));
    } catch (e) {
      fail("sem canal", String(e.message || e));
    }

    // restore email for later UI
    await prisma.lead.update({
      where: { id: leadId },
      data: { email: `smoke-states-${stamp}@acme.example` },
    });

    // 3) aberto overdue (KEEP)
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await prisma.activity.create({
      data: {
        leadId,
        authorId: owner.id,
        type: "WHATSAPP",
        outcome: "SENT_NO_REPLY",
        body: "smoke states overdue",
      },
    });
    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: "CONTACTED", nextFollowUpAt: past },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    try {
      await expect(page.getByTestId("lead-next-action")).toHaveAttribute(
        "data-follow-up-state",
        "overdue",
      );
      await expect(page.getByText("Follow-up atrasado")).toBeVisible();
      pass("aberto overdue");
    } catch (e) {
      fail("aberto overdue", String(e.message || e));
    }

    // 4) WON with residual FU — no urgency alert; DB preserved
    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: "WON", nextFollowUpAt: past },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    try {
      await expect(page.getByTestId("lead-next-action")).toHaveAttribute(
        "data-terminal",
        "true",
      );
      const alert = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll('[data-testid="lead-next-action"] *'),
        ).some((n) => /Follow-up (hoje|atrasado)/i.test(n.textContent || "")),
      );
      const kept = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { nextFollowUpAt: true, stage: true },
      });
      if (!alert && kept?.stage === "WON" && kept.nextFollowUpAt) {
        pass("WON sem urgência residual + nextFollowUpAt preservado");
      } else {
        fail(
          "WON residual",
          JSON.stringify({ alert, stage: kept?.stage, fu: !!kept?.nextFollowUpAt }),
        );
      }
    } catch (e) {
      fail("WON residual", String(e.message || e));
    }

    // 5) LOST with residual FU
    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: "LOST", nextFollowUpAt: past },
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    try {
      await expect(page.getByTestId("lead-next-action")).toHaveAttribute(
        "data-terminal",
        "true",
      );
      const alert = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll('[data-testid="lead-next-action"] *'),
        ).some((n) => /Follow-up (hoje|atrasado)/i.test(n.textContent || "")),
      );
      const kept = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { nextFollowUpAt: true },
      });
      if (!alert && kept?.nextFollowUpAt) {
        pass("LOST sem urgência residual + nextFollowUpAt preservado");
      } else {
        fail("LOST residual", JSON.stringify({ alert, fu: !!kept?.nextFollowUpAt }));
      }
    } catch (e) {
      fail("LOST residual", String(e.message || e));
    }

    await page.close();
  }

  // Mobile 390×844
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await login(page);
    await createLead(
      page,
      `Smoke States M ${stamp}`,
      `smoke-states-m-${stamp}@acme.example`,
    );
    try {
      await expect(page.getByTestId("lead-detail-layout")).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTestId("lead-intelligence-fallback").scrollIntoViewIfNeeded();
      await expect(page.getByTestId("lead-intelligence-fallback")).toBeVisible({
        timeout: 15_000,
      });
      await page.getByTestId("activity-timeline-empty").scrollIntoViewIfNeeded();
      await expect(page.getByTestId("activity-timeline-empty")).toBeVisible({
        timeout: 15_000,
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      const orderOk = await page.evaluate(() => {
        const ys = [
          '[data-testid="lead-next-action"]',
          '[data-testid="lead-contact-actions"]',
          "#register-activity",
          "#history-heading",
        ].map(
          (s) => document.querySelector(s)?.getBoundingClientRect().top ?? -1,
        );
        for (let i = 1; i < ys.length; i++) {
          if (ys[i] + 1 < ys[i - 1]) return false;
        }
        return true;
      });
      if (!overflow && orderOk) pass("mobile 390×844");
      else fail("mobile 390×844", JSON.stringify({ overflow, orderOk }));
    } catch (e) {
      fail("mobile 390×844", String(e.message || e));
    }
    await page.close();
  }
} finally {
  await prisma.$disconnect();
  await browser.close();
}

const failed = results.some(([, status]) => status === "FAIL");
console.log(`\nOVERALL ${failed ? "FAIL" : "PASS"}`);
process.exit(failed ? 1 : 0);
