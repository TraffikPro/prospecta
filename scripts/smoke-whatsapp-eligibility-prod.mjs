/**
 * Production smoke — WhatsApp contact eligibility (#69) after migrate deploy.
 * Credentials from env only — never logged.
 *
 * Required:
 *   SMOKE_BASE_URL (default https://prospecta-ten-tau.vercel.app)
 *   SMOKE_MEMBER_PASSWORD / E2E_MEMBER_PASSWORD / SEED_MEMBER_PASSWORD
 *
 * Optional cleanup:
 *   DATABASE_URL + PROSPECTA_ALLOW_PROD_DB_MUTATION=I_UNDERSTAND_PROD_MUTATION
 *   deletes the synthetic smoke lead at the end.
 */
import { chromium, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

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
const LEAD_DETAIL_URL = /\/app\/leads\/(?!new(?:\?|$))[^/?]+/;
const BLOCKED_HOSTS = /devflow|facebook\.com|graph\.facebook|whatsapp\.com\/v\d|meta\.com/i;

function pass(name, detail = "") {
  results.push([name, "PASS", detail]);
  console.log("PASS", name, detail);
}
function fail(name, detail = "") {
  results.push([name, "FAIL", detail]);
  console.log("FAIL", name, detail);
}

function leadIdFromUrl(url) {
  return url.split("/").pop().split("?")[0];
}

function dbFingerprint(databaseUrl) {
  const host = databaseUrl?.split("@")[1]?.split("/")[0];
  if (!host) return null;
  return createHash("sha256").update(host).digest("hex").slice(0, 12);
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 45_000 });
}

async function createLeadWithPhone(page) {
  const company = `Smoke WA Elig ${stamp}`;
  const leadEmail = `smoke-wa-elig-${stamp}@acme.example`;
  // Valid BR mobile shape used elsewhere in e2e (Santos area)
  const phone = `1398${String(stamp).slice(-7)}`;
  await page.goto(`${baseURL}/app/leads/new`);
  await page.getByLabel("Empresa").fill(company);
  await page.getByLabel("E-mail").fill(leadEmail);
  const phoneField = page.getByLabel(/Telefone|Phone/i);
  await phoneField.fill(phone);
  await page.getByRole("button", { name: "Salvar lead" }).click();
  await page.waitForURL(LEAD_DETAIL_URL, { timeout: 30_000 });
  return { url: page.url().split("?")[0], company, phone };
}

const browser = await chromium.launch({ headless: true });
let leadId = null;

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const outbound = [];
  page.on("request", (request) => outbound.push(request.url()));

  await login(page);
  pass("login member");

  const created = await createLeadWithPhone(page);
  leadId = leadIdFromUrl(created.url);
  pass("create lead with phone", leadId);

  const channel = page.getByTestId("whatsapp-authorized-channel");
  try {
    await expect(channel).toBeVisible({ timeout: 20_000 });
    await expect(channel).toHaveAttribute("data-consent-status", "UNKNOWN");
    await expect(page.getByTestId("whatsapp-eligibility-status")).toHaveText(
      "Não verificada",
    );
    await expect(channel.getByRole("button", { name: "Enviar" })).toHaveCount(0);
    pass("eligibility UNKNOWN + no Enviar");
  } catch (e) {
    fail("eligibility UNKNOWN + no Enviar", String(e.message || e));
  }

  try {
    await expect(page.getByTestId("lead-manual-contact-label")).toHaveText(
      "Contato manual (Sprint 0)",
    );
    const contactLink = page
      .getByTestId("lead-contact-actions")
      .getByRole("link", { name: /Abrir WhatsApp|Contatar/i });
    await expect(contactLink).toBeVisible();
    const href = await contactLink.getAttribute("href");
    if (!href || !/wa\.me|api\.whatsapp\.com/.test(href)) {
      throw new Error(`unexpected whatsapp href: ${href ?? "[null]"}`);
    }
    // Prefer href assertion over popup (prod may block window.open in headless).
    pass("manual wa.me Abrir WhatsApp", href.replace(/\d{6,}/g, "***"));
  } catch (e) {
    fail("manual wa.me Abrir WhatsApp", String(e.message || e));
  }

  try {
    const optIn = page.getByTestId("whatsapp-opt-in-form");
    await optIn.locator('select[name="source"]').selectOption("PHONE_CALL");
    await optIn.locator('select[name="purpose"]').selectOption("PRESENTATION");
    const e164 = await optIn.locator('input[name="phoneE164"]').inputValue();
    if (!e164.startsWith("+55")) {
      throw new Error(`expected E.164 +55, got ${e164 ? "[set]" : "[empty]"}`);
    }
    await optIn.getByRole("button", { name: "Registrar autorização" }).click();
    await expect(page.getByTestId("whatsapp-authorized-channel")).toHaveAttribute(
      "data-consent-status",
      "OPTED_IN",
      { timeout: 20_000 },
    );
    await expect(page.getByTestId("whatsapp-api-unavailable")).toContainText(
      "Autorizado, mas envio pela API ainda indisponível",
    );
    await expect(page.getByTestId("whatsapp-consent-event")).toHaveCount(1);
    pass("opt-in persists to OPTED_IN");
  } catch (e) {
    fail("opt-in persists to OPTED_IN", String(e.message || e));
  }

  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("whatsapp-authorized-channel")).toHaveAttribute(
      "data-consent-status",
      "OPTED_IN",
      { timeout: 20_000 },
    );
    await expect(page.getByTestId("whatsapp-consent-event")).toHaveCount(1);
    pass("opt-in survives reload");
  } catch (e) {
    fail("opt-in survives reload", String(e.message || e));
  }

  const blocked = outbound.some((url) => BLOCKED_HOSTS.test(url));
  if (blocked) fail("no Meta/DevFlow outbound", "blocked host requested");
  else pass("no Meta/DevFlow outbound");

  // Mobile overflow check
  {
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    try {
      await login(mobile);
      await mobile.goto(`${baseURL}/app/leads/${leadId}`);
      await expect(
        mobile.getByTestId("whatsapp-authorized-channel"),
      ).toBeVisible({ timeout: 20_000 });
      const overflow = await mobile.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      if (overflow > 1) fail("mobile no horizontal overflow", `overflow=${overflow}`);
      else pass("mobile no horizontal overflow");
    } catch (e) {
      fail("mobile no horizontal overflow", String(e.message || e));
    } finally {
      await mobile.close();
    }
  }
} catch (e) {
  fail("fatal", String(e.message || e));
} finally {
  await browser.close();
}

// Cleanup synthetic lead if break-glass + prod DATABASE_URL provided
const canCleanup =
  process.env.PROSPECTA_ALLOW_PROD_DB_MUTATION ===
    "I_UNDERSTAND_PROD_MUTATION" &&
  process.env.DATABASE_URL &&
  leadId &&
  dbFingerprint(process.env.DATABASE_URL) === "50218bdd86d8";

if (canCleanup) {
  const prisma = new PrismaClient();
  try {
    await prisma.whatsAppConsentEvent.deleteMany({ where: { leadId } });
    await prisma.lead.delete({ where: { id: leadId } });
    pass("cleanup smoke lead", leadId);
  } catch (e) {
    fail("cleanup smoke lead", String(e.message || e));
  } finally {
    await prisma.$disconnect();
  }
} else {
  console.log(
    "SKIP cleanup (set PROSPECTA_ALLOW_PROD_DB_MUTATION + prod DATABASE_URL to delete synthetic lead)",
  );
}

const failed = results.filter((r) => r[1] === "FAIL");
console.log("---");
console.log(
  failed.length === 0
    ? `OVERALL PASS (${results.length} checks)`
    : `OVERALL FAIL (${failed.length}/${results.length})`,
);
process.exit(failed.length === 0 ? 0 : 1);
