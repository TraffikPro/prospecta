import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { assertSafeForMutableTestsOrThrow } from "../src/lib/safety/production-mutation-guard.ts";

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadDotEnv(".env");
process.env.DATABASE_URL =
  "postgresql://prospecta:prospecta@127.0.0.1:5433/prospecta";
process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3000";
process.env.PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3000";

assertSafeForMutableTestsOrThrow({
  databaseUrl: process.env.DATABASE_URL,
  appUrl: process.env.PLAYWRIGHT_BASE_URL,
});

const outDir = path.join(
  "docs",
  "audits",
  "core-ui-ux-closure",
  "screenshots",
);
fs.mkdirSync(outDir, { recursive: true });

const prisma = new PrismaClient();
const member = await prisma.user.findUniqueOrThrow({
  where: { email: "comercial@prospecta.test" },
  select: { id: true },
});

const stamp = Date.now();
const createdExternalIds = [];

async function makeLead(partial) {
  createdExternalIds.push(partial.externalId);
  return prisma.lead.create({
    data: {
      companyName: partial.companyName,
      phone: partial.phone ?? null,
      email: partial.email ?? null,
      stage: partial.stage ?? "NEW",
      source: "MANUAL",
      ownerId: member.id,
      nextFollowUpAt: partial.nextFollowUpAt ?? null,
      lostReason: partial.lostReason ?? null,
      intelligence: partial.intelligence ?? undefined,
      externalId: partial.externalId,
    },
    select: { id: true, companyName: true },
  });
}

async function cleanupSyntheticLeads(externalIds = createdExternalIds) {
  if (externalIds.length === 0) return;
  const leads = await prisma.lead.findMany({
    where: {
      ownerId: member.id,
      externalId: { in: externalIds },
    },
    select: { id: true },
  });
  const ids = leads.map((lead) => lead.id);
  if (ids.length === 0) return;
  await prisma.activity.deleteMany({ where: { leadId: { in: ids } } });
  await prisma.lead.deleteMany({
    where: { id: { in: ids }, ownerId: member.id },
  });
  console.log(`CLEANUP removed ${ids.length} synthetic leads`);
}

/** Only synthetic e2e/qa rows on the isolated local DB — never broad deletes. */
async function cleanupStaleSyntheticPollution() {
  const stale = await prisma.lead.findMany({
    where: {
      ownerId: member.id,
      OR: [
        { externalId: { startsWith: "e2e-" } },
        { externalId: { startsWith: "qa-" } },
        { companyName: { startsWith: "Empresa Fila E2E" } },
        { companyName: { startsWith: "QA Overdue" } },
        { companyName: { startsWith: "QA Sem Canal" } },
        { companyName: { startsWith: "QA Won" } },
        { companyName: { startsWith: "QA Lost" } },
        { companyName: { startsWith: "QA Playbook" } },
        { companyName: { startsWith: "QA Empresa Com Nome" } },
      ],
    },
    select: { id: true, externalId: true },
  });
  const ids = stale.map((lead) => lead.id);
  if (ids.length === 0) return;
  await prisma.activity.deleteMany({ where: { leadId: { in: ids } } });
  await prisma.lead.deleteMany({
    where: { id: { in: ids }, ownerId: member.id },
  });
  console.log(`CLEANUP_STALE removed ${ids.length} prior synthetic leads`);
}

await cleanupStaleSyntheticPollution();

const overdue = await makeLead({
  companyName: `QA Overdue ${stamp}`,
  phone: `1391${String(stamp).slice(-7)}`,
  nextFollowUpAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  externalId: `qa-overdue-${stamp}`,
  intelligence: {
    score: 100,
    qualification: "HIGH",
    signals: ["NO_WEBSITE"],
    campaign: "santos-odontologia-2026-07",
  },
});
// Overdue bucket requires a prior commercial activity; without it the lead
// stays in "no_contact" / filter=new even with a past nextFollowUpAt.
await prisma.activity.create({
  data: {
    leadId: overdue.id,
    authorId: member.id,
    type: "WHATSAPP",
    outcome: "SENT_NO_REPLY",
    body: `QA seed contact overdue ${stamp}`,
  },
});
const noChannel = await makeLead({
  companyName: `QA Sem Canal ${stamp}`,
  email: `qa-nochan-${stamp}@example.test`,
  externalId: `qa-nochan-${stamp}`,
});
const won = await makeLead({
  companyName: `QA Won ${stamp}`,
  phone: `1392${String(stamp).slice(-7)}`,
  stage: "WON",
  externalId: `qa-won-${stamp}`,
});
const lost = await makeLead({
  companyName: `QA Lost ${stamp}`,
  phone: `1393${String(stamp).slice(-7)}`,
  stage: "LOST",
  lostReason: "Sem fit comercial",
  externalId: `qa-lost-${stamp}`,
});

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

async function login() {
  await page.goto("http://127.0.0.1:3000/login");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("comercial@prospecta.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.E2E_MEMBER_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app(\/|$)/);
}

async function shot(name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`SHOT ${file}`);
}

async function waitQueueEmptyFilter() {
  // Prefer conversation empty; fall back to follow-up if residual non-synthetic
  // conversation leads remain on the isolated DB.
  for (const filter of ["conversation", "follow-up"]) {
    await page.goto(`http://127.0.0.1:3000/app/my-leads?filter=${filter}`);
    await page.getByRole("heading", { name: "Minha fila" }).waitFor();
    const empty = page.getByTestId("my-queue-empty");
    try {
      await empty.waitFor({ state: "visible", timeout: 8_000 });
      await expectEmptyCopy(filter);
      return filter;
    } catch {
      console.log(`EMPTY_FILTER ${filter} not empty; trying next`);
    }
  }
  throw new Error("No empty queue filter available for empty-state capture");
}

async function expectEmptyCopy(filter) {
  const copy =
    filter === "conversation"
      ? "Nenhum lead em conversa neste filtro."
      : "Nenhum follow-up para hoje neste filtro.";
  await page.getByText(copy).waitFor({ state: "visible" });
}

async function waitTimelineHasBody(body) {
  await page.getByTestId("activity-timeline").waitFor({ state: "visible" });
  await page
    .getByTestId("activity-timeline")
    .getByText(body, { exact: true })
    .waitFor({ state: "visible" });
  await page.getByTestId("activity-timeline-empty").waitFor({ state: "hidden" });
}

try {
  await login();

  for (const [label, size] of [
    ["desktop-1440x900", { width: 1440, height: 900 }],
    ["desktop-1280x720", { width: 1280, height: 720 }],
    ["mobile-390x844", { width: 390, height: 844 }],
  ]) {
    await page.setViewportSize(size);
    await page.goto("http://127.0.0.1:3000/app/my-leads");
    await page.getByRole("heading", { name: "Minha fila" }).waitFor();
    await shot(`${label}-queue`);
    await page.goto("http://127.0.0.1:3000/app/my-leads?filter=overdue");
    await page.getByText(overdue.companyName, { exact: true }).waitFor({
      state: "visible",
    });
    await shot(`${label}-queue-overdue`);
    await waitQueueEmptyFilter();
    await shot(`${label}-queue-empty-filter`);
    await page.goto(
      `http://127.0.0.1:3000/app/leads/${overdue.id}?from=my-leads&filter=overdue`,
    );
    await page.getByRole("heading", { name: overdue.companyName }).waitFor();
    await shot(`${label}-lead-overdue`);
    await page.goto(`http://127.0.0.1:3000/app/leads/${noChannel.id}`);
    await shot(`${label}-lead-no-channel`);
    await page.goto(`http://127.0.0.1:3000/app/leads/${won.id}`);
    await shot(`${label}-lead-won`);
    await page.goto(`http://127.0.0.1:3000/app/leads/${lost.id}`);
    await shot(`${label}-lead-lost`);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(
    `http://127.0.0.1:3000/app/leads/${overdue.id}?from=my-leads&filter=overdue#register-activity`,
  );
  await page.locator("#register-activity").getByLabel("Descrição").fill("");
  await page
    .locator("#register-activity")
    .getByRole("button", { name: "Salvar atividade" })
    .click();
  await shot("desktop-1440x900-activity-validation-error");

  const activityBody = `QA visual registro sintético ${stamp}`;
  await page
    .locator("#register-activity")
    .getByLabel("Descrição")
    .fill(activityBody);
  await page
    .locator("#register-activity")
    .getByLabel(/Próximo passo/)
    .fill("2026-10-08T10:00");
  await page
    .locator("#register-activity")
    .getByRole("button", { name: "Salvar atividade" })
    .click();
  await page.getByTestId("activity-success-back").waitFor({ state: "visible" });
  await waitTimelineHasBody(activityBody);
  await shot("desktop-1440x900-activity-success");

  await page.getByTestId("activity-register-another").click();
  await page
    .locator("#register-activity")
    .getByRole("button", { name: "Salvar atividade" })
    .waitFor({ state: "visible" });
  await shot("desktop-1440x900-activity-register-another");

  const playbookLead = await makeLead({
    companyName: `QA Playbook ${stamp}`,
    phone: `1394${String(stamp).slice(-7)}`,
    externalId: `qa-playbook-${stamp}`,
    intelligence: {
      score: 100,
      qualification: "HIGH",
      signals: ["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"],
      campaign: "santos-odontologia-2026-07",
      rating: 4.8,
      reviews: 120,
      diagnostic: "QA playbook",
      pitch: "Pitch QA",
    },
  });
  await page.goto(`http://127.0.0.1:3000/app/leads/${playbookLead.id}`);
  await page.reload({ waitUntil: "networkidle" });
  const reasonsToggle = page.getByTestId("playbook-reasons-toggle");
  await reasonsToggle.waitFor({ state: "visible" });
  await reasonsToggle.focus();
  await shot("desktop-1440x900-playbook-reasons-focus");
  await reasonsToggle.click();
  await page.getByTestId("playbook-reasons-detail").waitFor({ state: "visible" });
  await shot("desktop-1440x900-playbook-reasons-expanded-click");
  await reasonsToggle.click();
  await page.getByTestId("playbook-reasons-detail").waitFor({ state: "hidden" });
  await reasonsToggle.focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("playbook-reasons-detail").waitFor({ state: "visible" });
  await shot("desktop-1440x900-playbook-reasons-expanded-keyboard");

  // Zoom classification:
  // - Emulation.setPageScaleFactor = CDP page scale (pinch/visual scale), NOT
  //   browser Ctrl+/- zoom with layout reflow.
  // - Real browser zoom is attempted below; if layout metrics do not change,
  //   it remains pending.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:3000/app/my-leads");
  await page.getByRole("heading", { name: "Minha fila" }).waitFor();
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  await shot("desktop-1440x900-cdp-page-scale-2");
  await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });

  const beforeZoom = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    devicePixelRatio: window.devicePixelRatio,
    visualViewportScale: window.visualViewport?.scale ?? null,
    rootFontSize: getComputedStyle(document.documentElement).fontSize,
  }));
  let keyboardZoomError = null;
  try {
    await page.keyboard.down("Control");
    await page.keyboard.press("+");
    await page.keyboard.press("+");
    await page.keyboard.up("Control");
  } catch (error) {
    keyboardZoomError = String(error);
    try {
      await page.keyboard.up("Control");
    } catch {
      /* ignore */
    }
  }
  const afterKeyboardZoom = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    outerWidth: window.outerWidth,
    devicePixelRatio: window.devicePixelRatio,
    visualViewportScale: window.visualViewport?.scale ?? null,
    rootFontSize: getComputedStyle(document.documentElement).fontSize,
  }));
  const browserZoomChanged =
    beforeZoom.innerWidth !== afterKeyboardZoom.innerWidth ||
    beforeZoom.devicePixelRatio !== afterKeyboardZoom.devicePixelRatio ||
    beforeZoom.rootFontSize !== afterKeyboardZoom.rootFontSize ||
    beforeZoom.visualViewportScale !== afterKeyboardZoom.visualViewportScale;
  fs.writeFileSync(
    path.join(outDir, "..", "zoom-classification.json"),
    JSON.stringify(
      {
        methodAttempted: "Playwright Control++ (browser zoom shortcut)",
        cdpPageScaleFactorShot: "desktop-1440x900-cdp-page-scale-2.png",
        cdpMethod: "Emulation.setPageScaleFactor pageScaleFactor=2",
        cdpMeaning:
          "CDP page scale / visual magnification. Not browser zoom, deviceScaleFactor, CSS zoom, or viewport shrink.",
        browserZoomApplied: browserZoomChanged,
        beforeZoom,
        afterKeyboardZoom,
        note: browserZoomChanged
          ? "Keyboard zoom changed layout/visual metrics."
          : "Keyboard zoom did not change layout metrics in this Chromium session; real browser 200% zoom remains pending.",
      },
      null,
      2,
    ),
  );
  if (browserZoomChanged) {
    await shot("desktop-1440x900-browser-zoom-attempt");
  }
  console.log(
    `ZOOM_CLASSIFICATION browserZoomApplied=${browserZoomChanged} cdp=pageScaleFactor:2`,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3000/app/my-leads");
  await shot("mobile-390x844-bottom-nav");

  const long = await makeLead({
    companyName: `QA Empresa Com Nome Extremamente Longo Para Overflow ${stamp} Odontologia Especializada Santos Centro`,
    phone: `1395${String(stamp).slice(-7)}`,
    externalId: `qa-long-${stamp}`,
    intelligence: {
      score: 100,
      qualification: "HIGH",
      signals: ["NO_WEBSITE"],
    },
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:3000/app/my-leads?filter=new");
  await page.getByText(long.companyName.slice(0, 20)).first().waitFor();
  await shot("desktop-1280x720-queue-long-name");

  await browser.close();
  await cleanupSyntheticLeads();
  await prisma.$disconnect();
  console.log("VISUAL_QA_DONE");
} catch (error) {
  console.error(error);
  try {
    await browser.close();
  } catch {
    /* ignore */
  }
  try {
    await cleanupSyntheticLeads();
  } catch (cleanupError) {
    console.error(cleanupError);
  }
  await prisma.$disconnect();
  process.exit(1);
}
