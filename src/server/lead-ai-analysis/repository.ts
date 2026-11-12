import { Prisma, type PrismaClient, type LeadAIAnalysis } from "@prisma/client";
import { analysisReportSchema } from "../ai-analysis/schemas";
import { AnalysisAccessError, type AnalysisStore, type AnalysisView } from "./contracts";

import { ANALYSIS_USER_LIMITS } from "./usage-policy";
import { isAnalysisUserAllowed } from "./access-policy";

// Longer than the core's 45s budget. A dead worker is recovered on the next request.
const LEASE_MS = 90_000;
type Tx = Prisma.TransactionClient;
function view(row: LeadAIAnalysis): AnalysisView {
  return {
    id: row.id, leadId: row.leadId, status: row.status, errorCode: row.errorCode,
    report: row.report === null ? null : analysisReportSchema.parse(row.report),
    createdAt: row.createdAt.toISOString(), finishedAt: row.finishedAt?.toISOString() ?? null,
  };
}
async function authorize(tx: Tx, leadId: string, actorId: string) {
  // Consistent lock order: lead, then actor. No locks are held during LLM/HTTP work.
  await tx.$queryRaw`SELECT id FROM "Lead" WHERE id = ${leadId} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actorId} FOR SHARE`;
  const [actor, lead] = await Promise.all([
    tx.user.findUnique({ where: { id: actorId }, select: { id: true, email: true, role: true, isActive: true, mustChangePassword: true } }),
    tx.lead.findUnique({ where: { id: leadId }, select: {
      id: true, ownerId: true, companyName: true, website: true, source: true,
    } }),
  ]);
  if (!actor?.isActive || !isAnalysisUserAllowed(actor) || actor.mustChangePassword || !lead
    || (actor.role !== "ADMIN" && lead.ownerId !== actorId)) {
    throw new AnalysisAccessError("FORBIDDEN");
  }
  return lead;
}
async function databaseNow(tx: Tx): Promise<Date> {
  const [row] = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
  return row.now;
}
export function createAnalysisStore(db: PrismaClient): AnalysisStore {
  const transaction = <T>(fn: (tx: Tx) => Promise<T>) => db.$transaction(fn, { maxWait: 3_000, timeout: 5_000 });
  return {
    async claim({ leadId, actorId, requestKey }) {
      try {
        return await transaction(async (tx) => {
          // Serialize claims across leads/processes for this user, before any row locks.
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 4812))::text`;
          await authorize(tx, leadId, actorId);
          const now = await databaseNow(tx);
          await tx.leadAIAnalysis.updateMany({
            where: { leadId, status: "RUNNING", expiresAt: { lte: now } },
            data: { status: "FAILED", errorCode: "TIMEOUT", finishedAt: now },
          });
          const replay = await tx.leadAIAnalysis.findUnique({
            where: { requestedById_requestKey: { requestedById: actorId, requestKey } },
          });
          if (replay) {
            if (replay.leadId !== leadId) throw new AnalysisAccessError("CONFLICT");
            return { kind: "replay" as const, analysis: view(replay) };
          }
          const active = await tx.leadAIAnalysis.findFirst({ where: { leadId, status: "RUNNING" } });
          if (active) return { kind: "busy" as const, analysis: view(active) };
          const [hour, day] = await Promise.all([
            tx.leadAIAnalysis.count({ where: { requestedById: actorId, createdAt: { gte: new Date(now.getTime() - 3_600_000) } } }),
            tx.leadAIAnalysis.count({ where: { requestedById: actorId, createdAt: { gte: new Date(now.getTime() - 86_400_000) } } }),
          ]);
          if (hour >= ANALYSIS_USER_LIMITS.perHour || day >= ANALYSIS_USER_LIMITS.perDay) {
            throw new AnalysisAccessError("RATE_LIMITED");
          }
          const row = await tx.leadAIAnalysis.create({ data: {
            leadId, requestedById: actorId, requestKey, status: "RUNNING",
            expiresAt: new Date(now.getTime() + LEASE_MS),
          } });
          return { kind: "acquired" as const, analysis: view(row) };
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new AnalysisAccessError("CONFLICT");
        }
        throw error;
      }
    },
    async context(leadId, actorId) {
      return transaction(async (tx) => {
        const lead = await authorize(tx, leadId, actorId);
        return { leadId: lead.id, companyName: lead.companyName, website: lead.website,
          source: lead.source, reputation: { signals: [] } };
      });
    },
    async finish(id, actorId, result) {
      return transaction(async (tx) => {
        const row = await tx.leadAIAnalysis.findUnique({ where: { id } });
        if (!row || row.requestedById !== actorId) throw new AnalysisAccessError("FORBIDDEN");
        await authorize(tx, row.leadId, actorId);
        const now = await databaseNow(tx);
        const updated = await tx.leadAIAnalysis.updateMany({
          where: { id, requestedById: actorId, status: "RUNNING", expiresAt: { gt: now } },
          data: {
            status: result.status, errorCode: result.errorCode, finishedAt: now,
            report: result.report ?? Prisma.DbNull,
            analysisRunId: result.analysisRunId, agentVersion: result.agentVersion, model: result.model,
            steps: result.usage.steps, toolCalls: result.usage.toolCalls, tokens: result.usage.tokens,
            estimatedCostMicros: result.usage.estimatedCostMicros, durationMs: result.usage.durationMs,
          },
        });
        if (updated.count !== 1) throw new AnalysisAccessError("STALE_RUN");
        return view(await tx.leadAIAnalysis.findUniqueOrThrow({ where: { id } }));
      });
    },
    async fail(id, actorId) {
      await db.leadAIAnalysis.updateMany({
        where: { id, requestedById: actorId, status: "RUNNING" },
        data: { status: "FAILED", errorCode: "EXECUTION_FAILED", finishedAt: new Date() },
      });
    },
    async latest(leadId, actorId) {
      return transaction(async (tx) => {
        await authorize(tx, leadId, actorId);
        const row = await tx.leadAIAnalysis.findFirst({ where: { leadId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
        return row ? view(row) : null;
      });
    },
  };
}
