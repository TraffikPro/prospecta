import fs from "node:fs";
import { spawnSync } from "node:child_process";

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
process.env.UPSTASH_REDIS_REST_URL = "";
process.env.UPSTASH_REDIS_REST_TOKEN = "";
process.env.RATE_LIMIT_KEY_SECRET = "";
process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3000";
process.env.PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3000";
process.env.PROSPECTA_E2E_RATE_LIMIT_SCOPING = "1";

const args = process.argv.slice(2);
const command =
  process.platform === "win32"
    ? "node_modules\\.bin\\playwright.cmd"
    : "node_modules/.bin/playwright";
const result = spawnSync(command, args.length ? args : ["test"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});
if (result.error) {
  console.error(result.error);
}
process.exit(result.status ?? 1);
