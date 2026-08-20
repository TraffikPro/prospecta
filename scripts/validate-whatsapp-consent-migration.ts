import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { assertSafeForMutableTestsOrThrow } from "../src/lib/safety/production-mutation-guard";

const LOCAL_URL =
  "postgresql://prospecta:prospecta@127.0.0.1:5433/postgres";
const EMPTY_DB = "prospecta_mig_empty";
const LEGACY_DB = "prospecta_mig_legacy";
const NEW_MIGRATION = "20260818190000_whatsapp_contact_eligibility";

function psql(database: string, sql: string): string {
  return execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "prospecta",
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
      "-t",
      "-A",
      "-c",
      sql,
    ],
    { encoding: "utf8", cwd: process.cwd() },
  ).trim();
}

function psqlFile(database: string, sql: string): void {
  execFileSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "prospecta",
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "-",
    ],
    { encoding: "utf8", cwd: process.cwd(), input: sql },
  );
}

function applyMigrationSql(database: string, dirs: string[]): void {
  for (const dir of dirs) {
    const sql = readFileSync(
      path.join(process.cwd(), "prisma", "migrations", dir, "migration.sql"),
      "utf8",
    );
    console.log(`apply ${dir}`);
    psqlFile(database, sql);
  }
}

function migrationDirs(): string[] {
  const root = path.join(process.cwd(), "prisma", "migrations");
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{14}_/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function dropAndCreate(database: string): void {
  psql(
    "postgres",
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${database}' AND pid <> pg_backend_pid();`,
  );
  psql("postgres", `DROP DATABASE IF EXISTS ${database};`);
  psql("postgres", `CREATE DATABASE ${database};`);
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function main(): void {
  assertSafeForMutableTestsOrThrow({ databaseUrl: LOCAL_URL });
  console.log("guard: local postgres only");

  const dirs = migrationDirs();
  assert(
    dirs.includes(NEW_MIGRATION),
    `missing ${NEW_MIGRATION}`,
  );
  const prior = dirs.filter((dir) => dir !== NEW_MIGRATION);
  const newSql = readFileSync(
    path.join(
      process.cwd(),
      "prisma",
      "migrations",
      NEW_MIGRATION,
      "migration.sql",
    ),
    "utf8",
  );

  console.log("\n== empty database ==");
  dropAndCreate(EMPTY_DB);
  applyMigrationSql(EMPTY_DB, dirs);
  const emptyStatus = psql(
    EMPTY_DB,
    `SELECT column_default FROM information_schema.columns WHERE table_name = 'Lead' AND column_name = 'whatsappConsentStatus';`,
  );
  assert(
    emptyStatus.includes("UNKNOWN"),
    `empty default was ${emptyStatus}`,
  );
  const emptyIndexes = psql(
    EMPTY_DB,
    `SELECT indexname FROM pg_indexes WHERE tablename = 'WhatsAppConsentEvent' ORDER BY indexname;`,
  );
  assert(
    emptyIndexes.includes("WhatsAppConsentEvent_leadId_createdAt_idx"),
    `missing leadId index: ${emptyIndexes}`,
  );
  assert(
    emptyIndexes.includes("WhatsAppConsentEvent_actorId_idx"),
    `missing actorId index: ${emptyIndexes}`,
  );
  const emptyFks = psql(
    EMPTY_DB,
    `SELECT conname FROM pg_constraint WHERE conrelid = '"WhatsAppConsentEvent"'::regclass AND contype = 'f' ORDER BY conname;`,
  );
  assert(
    emptyFks.includes("WhatsAppConsentEvent_leadId_fkey"),
    `missing lead FK: ${emptyFks}`,
  );
  assert(
    emptyFks.includes("WhatsAppConsentEvent_actorId_fkey"),
    `missing actor FK: ${emptyFks}`,
  );
  console.log("empty database: default UNKNOWN, indexes and FKs present");

  console.log("\n== preexisting leads (pre-eligibility schema) ==");
  dropAndCreate(LEGACY_DB);
  applyMigrationSql(LEGACY_DB, prior);
  psqlFile(
    LEGACY_DB,
    `
    INSERT INTO "User" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt")
    VALUES (
      'legacy_owner',
      'legacy-owner@prospecta.test',
      'Legacy Owner',
      'not-a-real-hash',
      'MEMBER',
      true,
      NOW(),
      NOW()
    );
    INSERT INTO "Lead" (
      id, "companyName", phone, stage, "ownerId", source, "createdAt", "updatedAt"
    )
    VALUES (
      'legacy_lead',
      'Clinica Legacy Santos',
      '13999998888',
      'NEW',
      'legacy_owner',
      'GOOGLE_PLACES',
      NOW(),
      NOW()
    );
    `,
  );
  const beforeCols = psql(
    LEGACY_DB,
    `SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Lead' AND column_name IN ('whatsappConsentStatus', 'phoneE164');`,
  );
  assert(beforeCols === "0", `legacy schema already had consent columns: ${beforeCols}`);
  console.log("apply eligibility migration onto leads with phone");
  psqlFile(LEGACY_DB, newSql);
  const row = psql(
    LEGACY_DB,
    `SELECT "whatsappConsentStatus" || ',' || COALESCE("phoneE164", 'NULL') FROM "Lead" WHERE id = 'legacy_lead';`,
  );
  assert(row === "UNKNOWN,NULL", `legacy lead after migrate was ${row}`);
  const eventCount = psql(
    LEGACY_DB,
    `SELECT COUNT(*) FROM "WhatsAppConsentEvent";`,
  );
  assert(eventCount === "0", `migration invented events: ${eventCount}`);
  console.log("preexisting lead: UNKNOWN, phoneE164 NULL, no invented events");
}

main();
