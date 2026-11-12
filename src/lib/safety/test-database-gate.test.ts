import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  BREAK_GLASS_ENV,
  BREAK_GLASS_VALUE,
} from "./production-mutation-guard";
import {
  evaluateTestDatabaseUrl,
  isProcessEnvFile,
  stripDatabaseUrlAssignment,
  TestDatabaseGateError,
} from "./test-database-gate";

const LOCAL_TEST_URL = "postgresql://gate:gate@127.0.0.1:5432/prospecta_test";
const OTHER_LOCAL_URL = "postgresql://gate:gate@127.0.0.1:5432/prospecta_ci";
const NEON_URL = "postgresql://gate:gate@ep-fictional.neon.tech/neondb";
const REMOTE_URL = "postgresql://gate:gate@db.example.test/prospecta_test";
const TSX_CLI = path.resolve("node_modules/tsx/dist/cli.mjs");
const PRELOAD = path.resolve("src/lib/safety/test-database-preload.cjs");

describe("test database URL policy", () => {
  it("allows a dedicated local test database", () => {
    assert.deepEqual(evaluateTestDatabaseUrl(LOCAL_TEST_URL), {
      ok: true,
      host: "127.0.0.1",
      database: "prospecta_test",
    });
    assert.equal(
      evaluateTestDatabaseUrl("postgresql://gate:gate@localhost:5433/prospecta_ci")
        .ok,
      true,
    );
    assert.equal(
      evaluateTestDatabaseUrl("postgres://gate:gate@[::1]:5432/prospecta_test")
        .ok,
      true,
    );
  });

  it("blocks a fictional Neon host, a generic remote host, and the dev database", () => {
    assert.equal(rejectionReason(NEON_URL), "remote_host");
    assert.equal(rejectionReason(REMOTE_URL), "remote_host");
    assert.equal(
      rejectionReason("postgresql://gate:gate@127.0.0.1:5433/prospecta"),
      "unapproved_database",
    );
  });

  it("blocks a missing or malformed URL", () => {
    assert.equal(rejectionReason(undefined), "missing");
    assert.equal(rejectionReason(""), "missing");
    assert.equal(rejectionReason("not a url"), "malformed");
    assert.equal(
      rejectionReason("http://127.0.0.1/prospecta_test"),
      "malformed",
    );
  });

  it("removes DATABASE_URL from env file text and ignores .env.example", () => {
    const stripped = stripDatabaseUrlAssignment(
      [
        "AUTH_SECRET=abc",
        'DATABASE_URL="postgresql://gate:gate@ep-fictional.neon.tech/neondb"',
        "export DATABASE_URL=postgresql://gate:gate@db.example.test/prospecta",
        "# DATABASE_URL=keep",
        "EMAIL_PROVIDER=console",
      ].join("\n"),
    );
    const assignments = stripped
      .split("\n")
      .filter((line) => /^(export\s+)?DATABASE_URL\s*=/.test(line.trim()));
    assert.equal(assignments.length, 0);
    assert.equal(stripped.includes("# DATABASE_URL=keep"), true);
    assert.equal(stripped.includes("AUTH_SECRET=abc"), true);
    assert.equal(isProcessEnvFile(".env"), true);
    assert.equal(isProcessEnvFile(".env.local"), true);
    assert.equal(isProcessEnvFile(".env.example"), false);
  });
});

describe("test database gate process", () => {
  it("accepts a dedicated local URL before tests start", { timeout: 30_000 }, () => {
    const output = runGate('console.log("GATE_OPEN")', LOCAL_TEST_URL);
    assert.match(output, /GATE_OPEN/);
    assert.doesNotMatch(output, /TEST_DATABASE_GATE/);
  });

  it("blocks a fictional Neon URL before Prisma can start", { timeout: 30_000 }, () => {
    const output = runGate(
      'console.log("SCRIPT_RAN"); await import("@prisma/client"); console.log("CONSTRUCTED");',
      NEON_URL,
      { expectFailure: true },
    );
    assert.doesNotMatch(output, /SCRIPT_RAN/);
    assert.doesNotMatch(output, /CONSTRUCTED/);
    assert.match(output, /TEST_DATABASE_GATE remote_host/);
  });

  it("blocks a generic remote host", { timeout: 30_000 }, () => {
    const output = runGate('console.log("SCRIPT_RAN")', REMOTE_URL, {
      expectFailure: true,
    });
    assert.doesNotMatch(output, /SCRIPT_RAN/);
    assert.match(output, /TEST_DATABASE_GATE remote_host/);
  });

  it("blocks a malformed URL", { timeout: 30_000 }, () => {
    const output = runGate('console.log("SCRIPT_RAN")', "not a url", {
      expectFailure: true,
    });
    assert.doesNotMatch(output, /SCRIPT_RAN/);
    assert.match(output, /TEST_DATABASE_GATE malformed/);
  });

  it("blocks Prisma when the URL is missing", { timeout: 30_000 }, () => {
    const output = runGate(
      [
        'console.log("BEFORE_" + (process.env.DATABASE_URL ? "set" : "unset"));',
        "try {",
        '  const loaded = await import("@prisma/client");',
        '  console.log("IMPORTED");',
        "  new loaded.PrismaClient();",
        '  console.log("CONSTRUCTED");',
        "} catch (error) {",
        '  const gateError = error;',
        '  console.log("THREW");',
        '  console.log("REASON_" + (gateError && gateError.reason ? gateError.reason : "none"));',
        '  console.log(String(gateError && gateError.message ? gateError.message : "none"));',
        "}",
        'console.log("AFTER_" + (process.env.DATABASE_URL ? "set" : "unset"));',
      ].join("\n"),
      undefined,
    );
    assert.match(output, /BEFORE_unset/);
    assert.match(output, /THREW/);
    assert.match(output, /REASON_missing|TEST_DATABASE_GATE missing/);
    assert.match(output, /AFTER_unset/);
    assert.doesNotMatch(output, /IMPORTED/);
    assert.doesNotMatch(output, /CONSTRUCTED/);
  });

  it("detects an attempt to replace the locked URL", { timeout: 30_000 }, () => {
    const output = runGate(
      [
        "try {",
        `  process.env.DATABASE_URL = ${JSON.stringify(OTHER_LOCAL_URL)};`,
        '  console.log("OVERWROTE");',
        "} catch (error) {",
        '  console.log("REASON_" + (error && error.reason ? error.reason : "none"));',
        "}",
      ].join("\n"),
      LOCAL_TEST_URL,
    );
    assert.match(output, /REASON_overwrite/);
    assert.doesNotMatch(output, /OVERWROTE/);
    assert.equal(output.includes(OTHER_LOCAL_URL), false);
  });

  it("does not let a later .env load replace the locked URL", { timeout: 30_000 }, () => {
    const output = runGate(
      [
        'console.log(process.env.DATABASE_URL === process.env.EXPECTED_DATABASE_URL ? "BEFORE_UNCHANGED" : "BEFORE_CHANGED");',
        "try {",
        '  const loaded = await import("@prisma/client");',
        '  console.log("IMPORTED");',
        "  if (process.env.DATABASE_URL !== process.env.EXPECTED_DATABASE_URL) {",
        '    console.log("AFTER_CHANGED");',
        "    process.exit(2);",
        "  }",
        "  new loaded.PrismaClient();",
        '  console.log("CONSTRUCTED");',
        "} catch (error) {",
        '  const gateError = error;',
        '  console.log("THREW");',
        '  console.log("REASON_" + (gateError && gateError.reason ? gateError.reason : "none"));',
        '  console.log(String(gateError && gateError.message ? gateError.message : "none"));',
        "}",
        'console.log(process.env.DATABASE_URL === process.env.EXPECTED_DATABASE_URL ? "AFTER_UNCHANGED" : "AFTER_CHANGED");',
      ].join("\n"),
      LOCAL_TEST_URL,
      { extraEnv: { EXPECTED_DATABASE_URL: LOCAL_TEST_URL } },
    );
    assert.match(output, /BEFORE_UNCHANGED/);
    assert.match(output, /IMPORTED/);
    assert.match(output, /CONSTRUCTED/);
    assert.match(output, /AFTER_UNCHANGED/);
    assert.doesNotMatch(output, /AFTER_CHANGED/);
  });

  it("ignores the production break-glass flag", { timeout: 30_000 }, () => {
    const output = runGate('console.log("SCRIPT_RAN")', NEON_URL, {
      expectFailure: true,
      extraEnv: { [BREAK_GLASS_ENV]: BREAK_GLASS_VALUE },
    });
    assert.doesNotMatch(output, /SCRIPT_RAN/);
    assert.match(output, /TEST_DATABASE_GATE remote_host/);
  });
});

function rejectionReason(databaseUrl: string | undefined): string {
  const verdict = evaluateTestDatabaseUrl(databaseUrl);
  if (verdict.ok) assert.fail("expected the database URL to be rejected");
  return verdict.reason;
}

function runGate(
  script: string,
  databaseUrl: string | undefined,
  options?: {
    expectFailure?: boolean;
    extraEnv?: Record<string, string>;
  },
): string {
  const cacheRoot = path.resolve("node_modules/.cache");
  fs.mkdirSync(cacheRoot, { recursive: true });
  const directory = fs.mkdtempSync(path.join(cacheRoot, "prospecta-gate-"));
  const scriptPath = path.join(directory, "probe.mjs");
  fs.writeFileSync(scriptPath, script);
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.DATABASE_URL;
  delete env.DOTENV_KEY;
  delete env[BREAK_GLASS_ENV];
  if (databaseUrl !== undefined) env.DATABASE_URL = databaseUrl;
  Object.assign(env, options?.extraEnv);

  const result = spawnSync(
    process.execPath,
    [TSX_CLI, "--require", PRELOAD, scriptPath],
    {
      cwd: process.cwd(),
      env,
      encoding: "utf8",
      timeout: 20_000,
      windowsHide: true,
    },
  );
  fs.rmSync(directory, { recursive: true, force: true });

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (/ep-icy|sa-east-1|aws\.neon/i.test(output)) {
    throw new TestDatabaseGateError(
      "overwrite",
      "Gate child output included a database URL.",
    );
  }
  if (result.error) {
    throw result.error;
  }
  if (options?.expectFailure) assert.notEqual(result.status, 0);
  else assert.equal(result.status, 0);
  return output;
}
