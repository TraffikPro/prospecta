/**
 * Manual product gate — PR #49 Commercial Clarity Fatia 1.
 * Credentials from env only — never logged.
 *
 * Required:
 *   SMOKE_BASE_URL
 *   SMOKE_MEMBER_EMAIL
 *   SMOKE_MEMBER_PASSWORD
 */
import { chromium } from "@playwright/test";

const baseURL = (process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
const email = process.env.SMOKE_MEMBER_EMAIL || "comercial@prospecta.test";
const password = process.env.SMOKE_MEMBER_PASSWORD;
const bypass =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
  process.env.SMOKE_VERCEL_BYPASS ||
  "";

const LEADS = [
  "Comsorriso",
  "Clínica Brasil Sorriso - Gonzaga",
  "Lux Estética Odontológica Santos",
  "Centro Santista de Odontologia",
  "Drª Ariany de França Ferreira",
];

const TECH_CODE_RE =
  /\b(HIGH_REPUTATION|HIGH_RATING|HIGH_REVIEWS|NO_WEBSITE|HIGH|MEDIUM|LOW)\b/;
const ENGLISHISH_RE =
  /\b(High reputation|Lead Intelligence|No website|Sem website identificado)\b/i;

if (!baseURL) {
  console.error("Missing SMOKE_BASE_URL");
  process.exit(1);
}
if (!password) {
  console.error("Missing SMOKE_MEMBER_PASSWORD");
  process.exit(1);
}

function checklist(name, flags, notes = []) {
  console.log(`\nLead — ${name}:`);
  console.log(`[${flags.noCodes ? "x" : " "}] Sem códigos/inglês`);
  console.log(`[${flags.noDupes ? "x" : " "}] Sem duplicações`);
  console.log(`[${flags.ratingReviews ? "x" : " "}] Nota e avaliações corretas`);
  console.log(`[${flags.maps ? "x" : " "}] Maps correto`);
  console.log(`[${flags.priorityPt ? "x" : " "}] Prioridade em português`);
  console.log(`[${flags.under15s ? "x" : " "}] Entendido em menos de 15s`);
  if (notes.length) {
    console.log("Observações:");
    for (const n of notes) console.log(`- ${n}`);
  }
}

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  // Vercel SSO may still intercept without bypass header.
  if (page.url().includes("vercel.com/login") || page.url().includes("sso-api")) {
    throw new Error("BLOCKED_VERCEL_SSO");
  }
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  try {
    await page.waitForURL(/\/app(\/|$)/, { timeout: 45_000 });
  } catch (err) {
    const url = page.url();
    const body = (await page.locator("body").innerText().catch(() => "")).slice(
      0,
      400,
    );
    throw new Error(`LOGIN_FAILED url=${url} body=${body.replace(/\s+/g, " ")}`);
  }
}

async function openLeadByName(page, companyName) {
  await page.goto(`${baseURL}/app/intelligence`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(500);

  // Prefer exact company link/card text.
  const link = page.getByRole("link", { name: companyName }).first();
  if (await link.count()) {
    await link.click();
    await page.waitForURL(/\/app\/leads\//, { timeout: 30_000 });
    return;
  }

  // Fallback: search leads list
  await page.goto(`${baseURL}/app/leads`, { waitUntil: "domcontentloaded" });
  const leadLink = page.getByRole("link", { name: companyName }).first();
  if (!(await leadLink.count())) {
    throw new Error(`LEAD_NOT_FOUND:${companyName}`);
  }
  await leadLink.click();
  await page.waitForURL(/\/app\/leads\//, { timeout: 30_000 });
}

async function evaluateLead(page, companyName) {
  const started = Date.now();
  const notes = [];

  await page.waitForSelector('[data-testid="lead-intelligence-card"], [data-testid="lead-intelligence-fallback"]', {
    timeout: 20_000,
  }).catch(() => null);

  const bodyText = (await page.locator("main").innerText()).replace(/\s+/g, " ");

  const hasIntel = await page.locator('[data-testid="lead-intelligence-card"]').count();
  if (!hasIntel) {
    notes.push("Card de inteligência ausente");
  }

  // Codes / English
  const codeHits = bodyText.match(TECH_CODE_RE) || [];
  // Allow "Prioridade alta" etc — filter bare HIGH/MEDIUM/LOW as whole badge-only risk
  const badCodes = codeHits.filter((c) => !["HIGH", "MEDIUM", "LOW"].includes(c) || /\bHIGH\b/.test(bodyText) && !/Prioridade alta/i.test(bodyText));
  // Stricter: internal snake codes always fail; bare HIGH fails unless Prioridade present nearby
  const snakeCodes = (bodyText.match(/\b(HIGH_REPUTATION|HIGH_RATING|HIGH_REVIEWS|NO_WEBSITE)\b/g) || []);
  const englishHits = bodyText.match(ENGLISHISH_RE) || [];
  const bareHigh =
    /\bHIGH\b/.test(bodyText) && !/Prioridade alta/i.test(bodyText);
  const noCodes = snakeCodes.length === 0 && englishHits.length === 0 && !bareHigh;
  if (snakeCodes.length) notes.push(`Códigos: ${snakeCodes.join(", ")}`);
  if (englishHits.length) notes.push(`Inglês: ${englishHits.join(", ")}`);
  if (bareHigh) notes.push("Badge HIGH sem Prioridade alta");

  // Duplicate signal labels
  const signalRoot = page.locator('[data-testid="intelligence-signals"]');
  let noDupes = true;
  if (await signalRoot.count()) {
    const labels = await signalRoot.locator("span").allTextContents();
    const normalized = labels.map((l) => l.trim()).filter(Boolean);
    const set = new Set(normalized);
    noDupes = set.size === normalized.length;
    if (!noDupes) notes.push(`Sinais duplicados: ${normalized.join(" | ")}`);
  } else {
    notes.push("Seção de sinais não encontrada");
    noDupes = false;
  }

  // Rating / reviews
  const ratingEl = page.locator('[data-testid="intelligence-rating"]');
  const reviewsEl = page.locator('[data-testid="intelligence-reviews"]');
  const hasRating = (await ratingEl.count()) > 0;
  const hasReviews = (await reviewsEl.count()) > 0;
  let ratingReviews = hasRating && hasReviews;
  if (hasRating) {
    const t = (await ratingEl.innerText()).trim();
    if (!/\d+,\d+\s+de\s+5/.test(t) && !/\d+(\.\d+)?\s+de\s+5/.test(t)) {
      ratingReviews = false;
      notes.push(`Nota formato inesperado: ${t}`);
    }
  } else {
    notes.push("Nota Google ausente na UI");
  }
  if (hasReviews) {
    const t = (await reviewsEl.innerText()).trim();
    if (!/avaliaç/i.test(t)) {
      ratingReviews = false;
      notes.push(`Avaliações formato inesperado: ${t}`);
    }
  } else {
    notes.push("Quantidade de avaliações ausente na UI");
  }

  // Maps
  const maps = page.locator('[data-testid="intelligence-google-maps-link"]');
  let mapsOk = false;
  if (await maps.count()) {
    const href = await maps.getAttribute("href");
    mapsOk = Boolean(href && /^https?:\/\//i.test(href));
    if (!mapsOk) notes.push(`Maps href inválido: ${href}`);
    else notes.push(`Maps href presente (${href.slice(0, 48)}…)`);
  } else {
    notes.push("Link Ver no Google Maps ausente");
  }

  // Priority PT
  const priorityPt =
    /Prioridade alta|Prioridade média|Prioridade baixa/i.test(bodyText);
  if (!priorityPt) notes.push("Prioridade em português não encontrada");

  // <15s heuristic: essential blocks present
  const elapsed = Date.now() - started;
  const under15s =
    hasIntel > 0 &&
    noCodes &&
    noDupes &&
    priorityPt &&
    elapsed < 15000 &&
    (await page.getByRole("heading", { name: companyName }).count().catch(() => 0)) >= 0;

  // Company name visible
  const nameVisible = bodyText.toLowerCase().includes(companyName.toLowerCase().slice(0, 12));
  if (!nameVisible) notes.push("Nome da empresa pouco evidente no main");

  const flags = {
    noCodes,
    noDupes,
    ratingReviews,
    maps: mapsOk,
    priorityPt,
    under15s: under15s && nameVisible,
  };

  checklist(companyName, flags, notes);
  return flags;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  extraHTTPHeaders: bypass
    ? {
        "x-vercel-protection-bypass": bypass,
        "x-vercel-set-bypass-cookie": "true",
      }
    : undefined,
});
const page = await context.newPage();

try {
  console.log(`BASE=${baseURL}`);
  console.log(`EMAIL=${email}`);
  console.log(`BYPASS=${bypass ? "yes" : "no"}`);
  await login(page);
  console.log("LOGIN=OK");

  const results = [];
  for (const name of LEADS) {
    try {
      await openLeadByName(page, name);
      const flags = await evaluateLead(page, name);
      results.push({ name, ok: Object.values(flags).every(Boolean), flags });
    } catch (err) {
      console.log(`\nLead — ${name}:`);
      console.log("[ ] Sem códigos/inglês");
      console.log("[ ] Sem duplicações");
      console.log("[ ] Nota e avaliações corretas");
      console.log("[ ] Maps correto");
      console.log("[ ] Prioridade em português");
      console.log("[ ] Entendido em menos de 15s");
      console.log(`Observações:\n- ERRO: ${err instanceof Error ? err.message : String(err)}`);
      results.push({ name, ok: false, error: String(err) });
    }
  }

  const passCount = results.filter((r) => r.ok).length;
  console.log(`\nSUMMARY=${passCount}/5 PASS`);
  process.exitCode = passCount === 5 ? 0 : 1;
} catch (err) {
  console.error("GATE_FAILED", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
