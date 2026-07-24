/**
 * Pilot data reset — deletes Activities + Leads only (Users untouched in v1).
 *
 * Usage:
 *   pnpm db:reset-pilot              # dry-run
 *   CONFIRM_PILOT_RESET=YES pnpm db:reset-pilot --apply
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hasApplyFlag(argv: string[]): boolean {
  return argv.includes("--apply");
}

function maskDatabaseUrl(url: string | undefined): string {
  if (!url) {
    return "(DATABASE_URL not set)";
  }
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return "(DATABASE_URL present, unparseable)";
  }
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

async function main() {
  const apply = hasApplyFlag(process.argv.slice(2));
  const confirmed = process.env.CONFIRM_PILOT_RESET === "YES";

  const [userCount, leadCount, activityCount] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.activity.count(),
  ]);

  const target = maskDatabaseUrl(process.env.DATABASE_URL);

  console.log("");
  console.log(apply ? "Pilot Reset Apply" : "Pilot Reset Preview");
  console.log("");
  console.log(`Database: ${target}`);
  console.log("");
  console.log(apply ? "Will delete:" : "Would delete:");
  console.log(`  Activities: ${activityCount}`);
  console.log(`  Leads: ${leadCount}`);
  console.log("");
  console.log("Would keep:");
  console.log(`  Users: ${userCount}`);
  console.log("");

  if (!apply) {
    console.log("No changes applied. Re-run with --apply and CONFIRM_PILOT_RESET=YES to delete.");
    return;
  }

  if (!confirmed) {
    console.error(
      "Refusing apply: set CONFIRM_PILOT_RESET=YES (and keep --apply).",
    );
    process.exitCode = 1;
    return;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { email: "asc" },
  });

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "asc" },
  });

  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "asc" },
  });

  const backupDir = path.join(process.cwd(), "backup");
  await mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `pilot-reset-${stamp()}.json`);

  const backupPayload = {
    createdAt: new Date().toISOString(),
    database: target,
    note: "Logical backup before pilot reset. No password hashes.",
    counts: {
      users: users.length,
      leads: leads.length,
      activities: activities.length,
    },
    users,
    leads,
    activities,
  };

  await writeFile(backupPath, JSON.stringify(backupPayload, null, 2), "utf8");
  console.log(`Backup written: ${backupPath}`);
  console.log("");

  const deletedActivities = await prisma.activity.deleteMany();
  const deletedLeads = await prisma.lead.deleteMany();

  const [usersRemaining, leadsRemaining, activitiesRemaining] =
    await Promise.all([
      prisma.user.count(),
      prisma.lead.count(),
      prisma.activity.count(),
    ]);

  console.log("Pilot Reset Applied");
  console.log("");
  console.log("Deleted:");
  console.log(`  Activities: ${deletedActivities.count}`);
  console.log(`  Leads: ${deletedLeads.count}`);
  console.log("");
  console.log("Remaining:");
  console.log(`  Users: ${usersRemaining}`);
  console.log(`  Leads: ${leadsRemaining}`);
  console.log(`  Activities: ${activitiesRemaining}`);
  console.log("");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
