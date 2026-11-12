import { defineConfig, devices } from "@playwright/test";
import { assertAuthorizedTestDatabase } from "./src/lib/safety/test-database-gate";

assertAuthorizedTestDatabase(process.env.DATABASE_URL);
const baseURL = "http://127.0.0.1:3218";
const enabled = process.env.LEAD_AI_ANALYSIS_ENABLED === "false" ? "false" : "true";
export default defineConfig({
  testDir: "./e2e", testMatch: "lead-ai-analysis.spec.ts", workers: 1,
  fullyParallel: false, retries: 0, timeout: 60_000,
  outputDir: "test-results/ai-analysis", reporter: "list",
  use: { ...devices["Desktop Chrome"], baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "node --require ./src/lib/safety/test-database-preload.cjs node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3218",
    url: baseURL, reuseExistingServer: false, timeout: 120_000,
    env: { DATABASE_URL: process.env.DATABASE_URL!, NODE_ENV: "development",
      LEAD_AI_ANALYSIS_ENABLED: enabled, LEAD_AI_ANALYSIS_SIMULATED: "true",
      NEXT_PUBLIC_APP_URL: baseURL, NEXT_TELEMETRY_DISABLED: "1" },
  },
});
