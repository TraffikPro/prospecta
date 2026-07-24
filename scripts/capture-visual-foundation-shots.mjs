import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = resolve("docs/product/assets/visual-foundation-v1");
mkdirSync(outDir, { recursive: true });

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@prospecta.test";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "AdminTest123!";
const memberEmail = process.env.E2E_MEMBER_EMAIL ?? "comercial@prospecta.test";
const memberPassword = process.env.E2E_MEMBER_PASSWORD ?? "MemberTest123!";

async function login(page, email, password) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => url.pathname === "/app" || url.pathname.startsWith("/app/"));
}

async function shot(page, name) {
  const path = resolve(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log("wrote", path);
}

async function run() {
  const browser = await chromium.launch();

  // Desktop 1440x900 — ADMIN /app, MEMBER my-leads + pipeline
  const desktop = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
  });
  const d = await desktop.newPage();
  await login(d, adminEmail, adminPassword);
  await d.goto("/app");
  await d.getByRole("heading", { name: /^Olá,/ }).waitFor();
  await shot(d, "desktop-1440-app-home");
  await desktop.close();

  const desktopMember = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
  });
  const dm = await desktopMember.newPage();
  await login(dm, memberEmail, memberPassword);
  await dm.goto("/app/my-leads");
  await dm.getByRole("heading", { name: "Minha operação" }).waitFor();
  await shot(dm, "desktop-1440-my-leads");
  await dm.goto("/app/pipeline");
  await dm.getByRole("heading", { name: "Pipeline", exact: true }).waitFor();
  await dm.getByTestId("pipeline-desktop").waitFor();
  await shot(dm, "desktop-1440-pipeline");
  await desktopMember.close();

  // Mobile 390x844
  const mobile = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
  });
  const m = await mobile.newPage();
  await login(m, memberEmail, memberPassword);
  await m.goto("/app");
  await m.getByRole("heading", { name: /^Olá,/ }).waitFor();
  await shot(m, "mobile-390-app-home");
  await m.goto("/app/my-leads");
  await m.getByRole("heading", { name: "Minha operação" }).waitFor();
  await shot(m, "mobile-390-my-leads");
  await m.goto("/app/pipeline");
  await m.getByTestId("pipeline-mobile").waitFor();
  await shot(m, "mobile-390-pipeline");
  await mobile.close();

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
