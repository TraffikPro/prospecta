import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(dir, "capture-github-social.html");
const outPath = path.join(dir, "prospecta-github-social-preview.png");

const htmlUrl = "file:///" + htmlPath.replace(/\\/g, "/");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1280, height: 640 },
  deviceScaleFactor: 1,
});
await page.goto(htmlUrl, { waitUntil: "networkidle" });
await page.waitForSelector("[data-fixture='prospecta-github-social-preview']");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: 1280, height: 640 },
});

await browser.close();

const stat = fs.statSync(outPath);
console.log(JSON.stringify({ outPath, bytes: stat.size, width: 1280, height: 640 }));
