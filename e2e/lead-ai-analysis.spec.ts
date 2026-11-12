import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { assertAuthorizedTestDatabase } from "../src/lib/safety/test-database-gate";

assertAuthorizedTestDatabase(process.env.DATABASE_URL);
const db = new PrismaClient();
const users: string[] = []; const leads: string[] = [];
let owner = ""; let outsider = ""; let sessionId = ""; let outsiderSession = "";
const disabled = process.env.LEAD_AI_ANALYSIS_ENABLED === "false";
test.beforeAll(async () => {
  for (let i = 0; i < 2; i++) {
    const user = await db.user.create({ data: { email: `ai-ui-${randomUUID()}@prospecta.test`, name: "Operador fictício", passwordHash: "not-a-login", role: "MEMBER" } });
    users.push(user.id);
  }
  [owner, outsider] = users;
  sessionId = (await db.session.create({ data: { userId: owner, expiresAt: new Date(Date.now() + 600_000) } })).id;
  outsiderSession = (await db.session.create({ data: { userId: outsider, expiresAt: new Date(Date.now() + 600_000) } })).id;
});
test.afterAll(async () => {
  await db.leadAIAnalysis.deleteMany({ where: { leadId: { in: leads } } });
  await db.lead.deleteMany({ where: { id: { in: leads } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
async function fixture(name = "Aurora", website: string | null = "https://aurora.example.test") {
  const lead = await db.lead.create({ data: { companyName: `[AI DEMO] ${name}`, ownerId: owner, website, intelligence: { preserved: true } } });
  leads.push(lead.id); return lead;
}
async function open(page: Page, id: string, session = sessionId) {
  await page.context().addCookies([{ name: "prospecta_session", value: session, url: "http://127.0.0.1:3218", httpOnly: true, sameSite: "Lax" }]);
  await page.goto(`/app/leads/${id}`);
}
test("disabled feature leaves the lead screen unchanged", async ({ page }) => {
  test.skip(!disabled);
  const lead = await fixture(); await open(page, lead.id);
  await expect(page.getByText(lead.companyName, { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("ai-analysis-card")).toHaveCount(0);
  expect(await db.leadAIAnalysis.count({ where: { leadId: lead.id } })).toBe(0);
});
test.describe("local simulated flow", () => {
  test.skip(disabled);
  test("empty → processing → report, persistent reload, desktop/mobile and no duplicate click", async ({ page }, info) => {
    const lead = await fixture(); const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await open(page, lead.id);
    const card = page.getByTestId("ai-analysis-card");
    await expect(card.getByText("Nenhuma análise foi realizada para este lead.")).toBeVisible();
    await card.getByRole("button", { name: "Analisar lead", exact: true }).evaluate((el: HTMLButtonElement) => { el.click(); el.click(); });
    await expect(card.getByText("Analisando o lead. Aguarde o resultado…")).toBeVisible();
    await expect(card.getByText("Análise concluída", { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(card.getByRole("heading", { name: "Evidências", exact: true })).toBeVisible();
    await expect(card.getByText("Demonstração local", { exact: true })).toBeVisible();
    expect(await db.leadAIAnalysis.count({ where: { leadId: lead.id } })).toBe(1);
    expect(await db.lead.findUnique({ where: { id: lead.id } })).toEqual(lead);
    await page.reload();
    await expect(card.getByText("Análise concluída", { exact: true })).toBeVisible();
    await card.screenshot({ path: info.outputPath("analysis-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: info.outputPath("analysis-mobile.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
  test("inconclusive and failure allow explicit retry", async ({ page }) => {
    const empty = await fixture("Sem site", null); await open(page, empty.id);
    const card = page.getByTestId("ai-analysis-card");
    await card.getByRole("button", { name: "Analisar lead", exact: true }).click();
    await expect(card.getByText("Informação insuficiente", { exact: true })).toBeVisible();
    await expect(card.getByRole("heading", { name: "O que ainda falta saber" })).toBeVisible();
    const failed = await fixture("[FAIL] Indisponível"); await open(page, failed.id);
    await card.getByRole("button", { name: "Analisar lead", exact: true }).click();
    await expect(card.getByText("Análise não concluída", { exact: true })).toBeVisible();
    await db.lead.update({ where: { id: failed.id }, data: { companyName: "[AI DEMO] Recuperado" } });
    await card.getByRole("button", { name: "Analisar novamente" }).click();
    await expect(card.getByText("Análise concluída", { exact: true })).toBeVisible();
    expect(await db.leadAIAnalysis.count({ where: { leadId: failed.id } })).toBe(2);
  });
  test("transport failure offers retry using the same idempotency key", async ({ page }) => {
    const lead = await fixture(); await open(page, lead.id);
    const bodies: string[] = [];
    await page.route(`**/app/leads/${lead.id}`, async (route) => {
      if (route.request().method() === "POST") {
        bodies.push(route.request().postData() ?? "");
        if (bodies.length === 1) { await route.abort("failed"); return; }
      }
      await route.continue();
    });
    const card = page.getByTestId("ai-analysis-card");
    await card.getByRole("button", { name: "Analisar lead", exact: true }).click();
    await expect(card.getByRole("alert")).toBeVisible();
    await card.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(card.getByText("Análise concluída", { exact: true })).toBeVisible();
    const uuid = /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}/;
    expect(bodies[0].match(uuid)?.[0]).toBeTruthy();
    expect(bodies[0].match(uuid)?.[0]).toBe(bodies[1].match(uuid)?.[0]);
    expect(await db.leadAIAnalysis.count({ where: { leadId: lead.id } })).toBe(1);
  });
  test("existing running analysis is polled to completion without a new request", async ({ page }) => {
    const lead = await fixture();
    const row = await db.leadAIAnalysis.create({ data: { leadId: lead.id, requestedById: owner, requestKey: randomUUID(), expiresAt: new Date(Date.now() + 90_000) } });
    await open(page, lead.id);
    const card = page.getByTestId("ai-analysis-card");
    await expect(card.getByText("Analisando o lead. Aguarde o resultado…")).toBeVisible();
    await db.leadAIAnalysis.update({ where: { id: row.id }, data: { status: "FAILED", errorCode: "TIMEOUT", finishedAt: new Date() } });
    await expect(card.getByText("Análise não concluída", { exact: true })).toBeVisible({ timeout: 12_000 });
    expect(await db.leadAIAnalysis.count({ where: { leadId: lead.id } })).toBe(1);
  });
  test("ownership revoked after page load blocks the action; outsider cannot view", async ({ page }) => {
    const lead = await fixture(); await open(page, lead.id);
    await db.lead.update({ where: { id: lead.id }, data: { ownerId: outsider } });
    const card = page.getByTestId("ai-analysis-card");
    await card.getByRole("button", { name: "Analisar lead", exact: true }).click();
    await expect(card.getByText("Você não tem mais acesso à análise deste lead.")).toBeVisible();
    expect(await db.leadAIAnalysis.count({ where: { leadId: lead.id } })).toBe(0);
    const otherLead = await fixture(); await open(page, otherLead.id, outsiderSession);
    await expect(page.getByTestId("ai-analysis-card")).toHaveCount(0);
  });
});
