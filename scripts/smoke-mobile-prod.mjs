/**
 * Production mobile smoke (390×844). Credentials from env only — never logged.
 *
 * Required:
 *   SMOKE_BASE_URL (or defaults to https://prospecta-ten-tau.vercel.app)
 *   SMOKE_MEMBER_EMAIL (or E2E_MEMBER_EMAIL / comercial@prospecta.test)
 *   SMOKE_MEMBER_PASSWORD (or E2E_MEMBER_PASSWORD / SEED_MEMBER_PASSWORD)
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
const note = `Smoke mobile prod ${stamp}`;

function assertNoHorizontalOverflow(page) {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth + 1;
  });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await context.newPage();

const results = [];

try {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 30_000 });

  const afterLogin = page.url();
  const landedMyLeads = /\/app\/my-leads/.test(afterLogin);
  results.push(["login → Minha fila", landedMyLeads ? "PASS" : `FAIL url=${afterLogin}`]);
  if (!landedMyLeads) {
    throw new Error(`Expected /app/my-leads after MEMBER login, got ${afterLogin}`);
  }

  await expect(page.getByTestId("mobile-nav-my-leads")).toBeVisible();
  results.push(["bottom nav visible", "PASS"]);
  results.push([
    "no horizontal overflow (fila)",
    (await assertNoHorizontalOverflow(page)) ? "PASS" : "FAIL",
  ]);

  await page.getByTestId("my-queue-filter-new").click();
  await expect(page).toHaveURL(/filter=new/);
  results.push(["filtrar Novo contato", "PASS"]);

  const card = page.getByTestId("my-queue-card").first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole("link", { name: "Abrir lead" }).click();
  await page.waitForURL(/\/app\/leads\/.+/);
  results.push(["abrir lead", "PASS"]);
  results.push([
    "no horizontal overflow (lead)",
    (await assertNoHorizontalOverflow(page)) ? "PASS" : "FAIL",
  ]);

  const pitchToggle = page.getByTestId("intelligence-pitch-toggle");
  if (await pitchToggle.count()) {
    await pitchToggle.click();
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByTestId("intelligence-pitch-copy").click();
    results.push(["copiar pitch", "PASS"]);
  } else {
    results.push(["copiar pitch", "SKIP (sem intelligence neste lead)"]);
  }

  await page
    .getByTestId("lead-contact-actions")
    .getByRole("link", { name: "Registrar resultado" })
    .click();
  const form = page.locator("#register-activity");
  await expect(form).toBeVisible();

  // Rough keyboard/CTA check: ensure submit button has layout box in viewport after focus
  await form.getByLabel("Descrição").click();
  await form.getByLabel("Tipo").selectOption("WHATSAPP");
  await form.getByLabel("Resultado").selectOption("SENT_NO_REPLY");
  await form.getByLabel("Descrição").fill(note);
  await form.getByLabel(/Próximo passo/).fill("2026-08-20T10:00");

  const submit = form.getByRole("button", { name: "Salvar atividade" });
  await expect(submit).toBeVisible();
  const box = await submit.boundingBox();
  const submitReachable = Boolean(box && box.y + box.height <= 844 + 40);
  results.push([
    "CTA salvar alcançável (viewport)",
    submitReachable ? "PASS" : "WARN (pode precisar scroll)",
  ]);

  await submit.click();
  await expect(page.getByText("Atividade registrada.")).toBeVisible({
    timeout: 20_000,
  });
  results.push(["registrar Activity + follow-up", "PASS"]);

  await page.getByRole("link", { name: "Voltar à fila" }).click();
  await expect(page).toHaveURL(/\/app\/my-leads\?filter=new/);
  results.push(["voltar com filtro preservado", "PASS"]);

  await page.getByTestId("mobile-nav-pipeline").click();
  await expect(page).toHaveURL(/\/app\/pipeline/);
  await expect(page.getByTestId("pipeline-mobile")).toBeVisible();
  results.push(["pipeline mobile accordion", "PASS"]);
  results.push([
    "no horizontal overflow (pipeline)",
    (await assertNoHorizontalOverflow(page)) ? "PASS" : "FAIL",
  ]);

  await page.getByTestId("mobile-nav-more").click();
  await expect(page).toHaveURL(/\/app\/more/);
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);
  results.push(["Mais → logout", "PASS"]);

  // Desktop regression smoke: login again, wide viewport, nav desktop present
  await context.close();
  const desk = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const dpage = await desk.newPage();
  await dpage.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await dpage.getByLabel("E-mail").fill(email);
  await dpage.getByLabel("Senha").fill(password);
  await dpage.getByRole("button", { name: "Entrar" }).click();
  await dpage.waitForURL(/\/app(\/|$)/, { timeout: 30_000 });
  await expect(dpage.getByRole("navigation", { name: "Principal" })).toBeVisible();
  await expect(dpage.getByTestId("mobile-nav-my-leads")).toBeHidden();
  results.push(["desktop nav (bottom nav oculto)", "PASS"]);
  await desk.close();
} catch (error) {
  results.push(["fatal", `FAIL ${error instanceof Error ? error.message : String(error)}`]);
  console.log("\n=== SMOKE RESULTS ===");
  for (const [name, status] of results) {
    console.log(`${status.padEnd(6)} ${name}`);
  }
  await browser.close();
  process.exit(1);
}

await browser.close();

console.log(`\n=== SMOKE MOBILE PROD @ ${baseURL} (390×844) ===`);
let failed = 0;
for (const [name, status] of results) {
  console.log(`${status.padEnd(6)} ${name}`);
  if (status.startsWith("FAIL")) failed += 1;
}
console.log(failed === 0 ? "\nOVERALL: PASS" : `\nOVERALL: FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);
