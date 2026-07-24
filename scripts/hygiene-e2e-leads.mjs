/**
 * Production Data Hygiene v1 — E2E lead inventory / cleanup.
 *
 * Modes:
 *   DRY_RUN (default) — list candidates only, never mutates
 *   DELETE — only with HYGIENE_CONFIRM_DELETE=DELETE_E2E_LEADS_PROD
 *
 * Selection is allowlist-based (explicit rules). Ambiguous Santos-related
 * matches are reported separately and block DELETE.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/hygiene-e2e-leads.mjs
 *   DATABASE_URL=... HYGIENE_MODE=DELETE HYGIENE_CONFIRM_DELETE=DELETE_E2E_LEADS_PROD node scripts/hygiene-e2e-leads.mjs
 */
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = (process.env.HYGIENE_MODE || "DRY_RUN").toUpperCase();
const confirm = process.env.HYGIENE_CONFIRM_DELETE || "";

/** @typedef {{ id: string; rule: string; field: string; value: string }} Match */

/** Explicit allowlist rules — a lead must match ≥1 to be a candidate. */
const ALLOWLIST_RULES = [
  {
    id: "company_e2e_token",
    description: "companyName contains standalone E2E / e2e token",
    test: (lead) => /\bE2E\b/i.test(lead.companyName),
  },
  {
    id: "company_empresa_e2e_prefix",
    description: "companyName starts with known E2E prefixes",
    test: (lead) =>
      /^(Empresa (E2E|Fila E2E|Activity E2E|Pipeline E2E|Pipeline Mobile|Lost E2E|Origem E2E|Dup A|Dup B)\b|Clínica (E2E|Mobile E2E|Breadcrumb E2E|Intel)\b|Mobile Crumb\b)/i.test(
        lead.companyName,
      ),
  },
  {
    id: "email_acme_example",
    description: "email domain acme.example (Playwright fixtures)",
    test: (lead) =>
      typeof lead.email === "string" &&
      /@(acme\.example)$/i.test(lead.email),
  },
  {
    id: "external_id_e2e_prefix",
    description: "externalId starts with e2e-",
    test: (lead) =>
      typeof lead.externalId === "string" &&
      /^e2e-/i.test(lead.externalId),
  },
];

function campaignFromIntelligence(intelligence) {
  if (!intelligence || typeof intelligence !== "object") return null;
  const campaign = /** @type {Record<string, unknown>} */ (intelligence).campaign;
  return typeof campaign === "string" ? campaign : null;
}

/** Company/campaign/externalId only — ignore synthetic pitch/notes. */
const SANTOS_HINT =
  /santos|brasil sorriso|comsorriso|centro santista|odontolog/i;

function isSantosRelated(lead) {
  const campaign = campaignFromIntelligence(lead.intelligence);
  const blob = [lead.companyName, campaign ?? "", lead.externalId ?? ""].join(
    " ",
  );
  return SANTOS_HINT.test(blob);
}

function dbHostFingerprint(url) {
  try {
    const host = url.split("@")[1]?.split("/")[0] ?? "unknown";
    return createHash("sha256").update(host).digest("hex").slice(0, 12);
  } catch {
    return "unknown";
  }
}

function evaluateLead(lead) {
  /** @type {Match[]} */
  const matches = [];
  for (const rule of ALLOWLIST_RULES) {
    if (rule.test(lead)) {
      matches.push({
        id: rule.id,
        rule: rule.description,
        field: rule.id.startsWith("company")
          ? "companyName"
          : rule.id.startsWith("email")
            ? "email"
            : "externalId",
        value:
          rule.id.startsWith("company")
            ? lead.companyName
            : rule.id.startsWith("email")
              ? lead.email ?? ""
              : lead.externalId ?? "",
      });
    }
  }
  const santosRelated = isSantosRelated(lead);
  return { matches, santosRelated };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  if (mode !== "DRY_RUN" && mode !== "DELETE") {
    console.error(`Invalid HYGIENE_MODE=${mode}`);
    process.exit(1);
  }

  if (mode === "DELETE" && confirm !== "DELETE_E2E_LEADS_PROD") {
    console.error(
      "DELETE refused: set HYGIENE_CONFIRM_DELETE=DELETE_E2E_LEADS_PROD",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const fp = dbHostFingerprint(process.env.DATABASE_URL);
  const startedAt = new Date().toISOString();

  try {
    const totalBefore = await prisma.lead.count();
    const activityBefore = await prisma.activity.count();
    const leads = await prisma.lead.findMany({
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        source: true,
        externalId: true,
        stage: true,
        notes: true,
        intelligence: true,
        createdAt: true,
        owner: { select: { email: true, name: true } },
        _count: { select: { activities: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    /** @type {Array<Record<string, unknown>>} */
    const candidates = [];
    /** @type {Array<Record<string, unknown>>} */
    const santosFlagged = [];
    /** @type {Array<Record<string, unknown>>} */
    const ambiguous = [];

    for (const lead of leads) {
      const { matches, santosRelated } = evaluateLead(lead);
      if (matches.length === 0) continue;

      const row = {
        id: lead.id,
        companyName: lead.companyName,
        source: lead.source,
        externalId: lead.externalId,
        email: lead.email,
        phone: lead.phone,
        stage: lead.stage,
        campaign: campaignFromIntelligence(lead.intelligence),
        activityCount: lead._count.activities,
        ownerEmail: lead.owner.email,
        createdAt: lead.createdAt.toISOString(),
        matchedRules: matches.map((m) => m.id),
        matchedRuleDetails: matches,
        santosRelated,
      };

      if (santosRelated) {
        santosFlagged.push(row);
        ambiguous.push({
          ...row,
          reason: "Santos-related tokens found alongside E2E allowlist match",
        });
      } else {
        candidates.push(row);
      }
    }

    const report = {
      mode,
      startedAt,
      databaseHostFingerprint: fp,
      totals: {
        leadsBefore: totalBefore,
        activitiesBefore: activityBefore,
        candidates: candidates.length,
        santosFlagged: santosFlagged.length,
        ambiguous: ambiguous.length,
        activitiesOnCandidates: candidates.reduce(
          (sum, c) => sum + /** @type {number} */ (c.activityCount),
          0,
        ),
      },
      allowlistRules: ALLOWLIST_RULES.map((r) => ({
        id: r.id,
        description: r.description,
      })),
      candidates,
      santosFlagged,
      ambiguous,
      usersPreservedNote:
        "Users @prospecta.test are intentionally out of scope for this hygiene slice.",
    };

    const outPath = resolve(
      process.cwd(),
      `hygiene-e2e-leads-report-${startedAt.replace(/[:.]/g, "-")}.json`,
    );
    writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

    console.log("=== HYGIENE E2E LEADS — " + mode + " ===");
    console.log(`db_fingerprint=${fp}`);
    console.log(`leads_total=${totalBefore}`);
    console.log(`activities_total=${activityBefore}`);
    console.log(`candidates=${candidates.length}`);
    console.log(`santos_flagged=${santosFlagged.length}`);
    console.log(`ambiguous=${ambiguous.length}`);
    console.log(`report=${outPath}`);
    console.log("");

    if (santosFlagged.length > 0) {
      console.log("--- SANTOS-RELATED (review separately; blocks DELETE) ---");
      for (const row of santosFlagged) {
        console.log(
          [
            row.id,
            JSON.stringify(row.companyName),
            `source=${row.source}`,
            `campaign=${row.campaign ?? "—"}`,
            `activities=${row.activityCount}`,
            `rules=${/** @type {string[]} */ (row.matchedRules).join("|")}`,
          ].join(" | "),
        );
      }
      console.log("");
    }

    console.log("--- CANDIDATES (E2E allowlist, not Santos-flagged) ---");
    if (candidates.length === 0) {
      console.log("(none)");
    } else {
      for (const row of candidates) {
        console.log(
          [
            row.id,
            JSON.stringify(row.companyName),
            `source=${row.source}`,
            `campaign=${row.campaign ?? "—"}`,
            `externalId=${row.externalId ?? "—"}`,
            `email=${row.email ?? "—"}`,
            `stage=${row.stage}`,
            `activities=${row.activityCount}`,
            `owner=${row.ownerEmail}`,
            `rules=${/** @type {string[]} */ (row.matchedRules).join("|")}`,
            `created=${row.createdAt}`,
          ].join(" | "),
        );
      }
    }

    if (mode === "DELETE") {
      const expectFp = process.env.HYGIENE_EXPECT_FINGERPRINT || "";
      const expectCandidates = Number(
        process.env.HYGIENE_EXPECT_CANDIDATES || "0",
      );
      const expectPreserved = Number(
        process.env.HYGIENE_EXPECT_PRESERVED || "5",
      );

      if (expectFp && expectFp !== fp) {
        console.error(
          `ABORT DELETE: fingerprint mismatch expect=${expectFp} got=${fp}`,
        );
        process.exit(2);
      }
      if (ambiguous.length > 0 || santosFlagged.length > 0) {
        console.error(
          "ABORT DELETE: ambiguous/Santos-flagged candidates present. Resolve manually.",
        );
        process.exit(2);
      }
      if (candidates.length === 0) {
        console.log("Nothing to delete.");
        process.exit(0);
      }
      if (expectCandidates > 0 && candidates.length !== expectCandidates) {
        console.error(
          `ABORT DELETE: candidate count mismatch expect=${expectCandidates} got=${candidates.length}`,
        );
        process.exit(2);
      }

      const preservedBefore = leads.filter((lead) => {
        const { matches } = evaluateLead(lead);
        return matches.length === 0;
      });
      if (preservedBefore.length !== expectPreserved) {
        console.error(
          `ABORT DELETE: preserved count mismatch expect=${expectPreserved} got=${preservedBefore.length}`,
        );
        process.exit(2);
      }

      const usersBefore = await prisma.user.findMany({
        select: { id: true, email: true },
        orderBy: { email: "asc" },
      });
      const preservedIds = preservedBefore.map((l) => l.id);

      const ids = candidates.map((c) => /** @type {string} */ (c.id));
      const expectedActivityDeletes = candidates.reduce(
        (sum, c) => sum + /** @type {number} */ (c.activityCount),
        0,
      );

      let result;
      try {
        result = await prisma.$transaction(async (tx) => {
          const activityCount = await tx.activity.count({
            where: { leadId: { in: ids } },
          });
          if (activityCount !== expectedActivityDeletes) {
            throw new Error(
              `activity count drift expect=${expectedActivityDeletes} got=${activityCount}`,
            );
          }
          const deletedActivities = await tx.activity.deleteMany({
            where: { leadId: { in: ids } },
          });
          const deletedLeads = await tx.lead.deleteMany({
            where: { id: { in: ids } },
          });
          if (deletedLeads.count !== ids.length) {
            throw new Error(
              `lead delete count drift expect=${ids.length} got=${deletedLeads.count}`,
            );
          }
          if (deletedActivities.count !== expectedActivityDeletes) {
            throw new Error(
              `activity delete count drift expect=${expectedActivityDeletes} got=${deletedActivities.count}`,
            );
          }
          return {
            activityCount,
            deletedActivities: deletedActivities.count,
            deletedLeads: deletedLeads.count,
          };
        });
      } catch (error) {
        console.error(
          "ABORT DELETE: transaction rolled back —",
          error instanceof Error ? error.message : String(error),
        );
        process.exit(2);
      }

      const leadsAfter = await prisma.lead.count();
      const activitiesAfter = await prisma.activity.count();
      const remainingE2e = await prisma.lead.count({
        where: {
          OR: [
            { companyName: { contains: "E2E", mode: "insensitive" } },
            { externalId: { startsWith: "e2e-" } },
            { email: { endsWith: "@acme.example" } },
          ],
        },
      });
      const preservedAfter = await prisma.lead.findMany({
        where: { id: { in: preservedIds } },
        select: {
          id: true,
          companyName: true,
          intelligence: true,
          _count: { select: { activities: true } },
        },
      });
      const usersAfter = await prisma.user.findMany({
        select: { id: true, email: true },
        orderBy: { email: "asc" },
      });

      const usersUnchanged =
        usersBefore.length === usersAfter.length &&
        usersBefore.every(
          (u, i) =>
            u.id === usersAfter[i]?.id && u.email === usersAfter[i]?.email,
        );

      console.log("");
      console.log("--- DELETE RESULT ---");
      console.log(`deleted_leads=${result.deletedLeads}`);
      console.log(`deleted_activities=${result.deletedActivities}`);
      console.log(`leads_after=${leadsAfter}`);
      console.log(`activities_after=${activitiesAfter}`);
      console.log(`remaining_e2e=${remainingE2e}`);
      console.log(`preserved_after=${preservedAfter.length}`);
      console.log(`users_unchanged=${usersUnchanged}`);
      console.log("--- PRESERVED LEADS ---");
      for (const row of preservedAfter) {
        const campaign = campaignFromIntelligence(row.intelligence);
        console.log(
          [
            row.id,
            JSON.stringify(row.companyName),
            `campaign=${campaign ?? "—"}`,
            `activities=${row._count.activities}`,
          ].join(" | "),
        );
      }

      const ok =
        remainingE2e === 0 &&
        preservedAfter.length === expectPreserved &&
        leadsAfter === expectPreserved &&
        usersUnchanged;

      if (!ok) {
        console.error(
          "VALIDATION FAILED after commit. Manual restore from report JSON required:",
          outPath,
        );
        process.exit(3);
      }
      console.log("");
      console.log("VALIDATION OK — 0 E2E leads; preserved set intact; users unchanged.");
    } else {
      console.log("");
      console.log(
        "DRY_RUN complete — no rows deleted. Review the list before authorizing DELETE.",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
