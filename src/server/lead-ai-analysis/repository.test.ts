import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { assertAuthorizedTestDatabase } from "@/lib/safety/test-database-gate";
import { runLeadAnalysis } from "../ai-analysis/orchestrator";
import { createScriptedProvider } from "../ai-analysis/provider";
import { createAnalysisStore } from "./repository";
import { createAnalysisService } from "./service";
import { AnalysisAccessError, type StoredResult } from "./contracts";

// No skip/fallback: this suite must run with the preload against a dedicated local DB.
assertAuthorizedTestDatabase(process.env.DATABASE_URL);
const db = new PrismaClient();
const store = createAnalysisStore(db);
const userIds: string[] = [];
const leadIds: string[] = [];
let owner = ""; let other = ""; let admin = "";
const input = (leadId: string, actorId = owner) => ({ leadId, actorId, requestKey: randomUUID() });
const terminal = (): StoredResult => ({ analysisRunId: randomUUID(), status: "FAILED", report: null,
  errorCode: "TIMEOUT", agentVersion: "test", model: "test", usage: { steps: 0, toolCalls: 0, tokens: 0, estimatedCostMicros: 0, durationMs: 0 } });
const forbidden = (e: unknown) => e instanceof AnalysisAccessError && e.code === "FORBIDDEN";
async function lead() {
  const row = await db.lead.create({ data: { companyName: "Fictional analysis test", ownerId: owner,
    email: "private@example.test", phone: "000000000", notes: "secret", intelligence: { original: true } } });
  leadIds.push(row.id); return row;
}
describe("lead analysis persistence on local PostgreSQL", () => {
  before(async () => {
    for (const role of ["MEMBER", "MEMBER", "ADMIN"] as const) {
      const u = await db.user.create({ data: { email: `ai-${randomUUID()}@prospecta.test`, name: "AI fixture", role, passwordHash: "not-a-login-hash" } });
      userIds.push(u.id);
    }
    [owner, other, admin] = userIds;
  });
  after(async () => {
    await db.leadAIAnalysis.deleteMany({ where: { leadId: { in: leadIds } } });
    await db.lead.deleteMany({ where: { id: { in: leadIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  });
  it("authorizes owner/admin and denies other owner/missing lead for reads and writes", async () => {
    const l = await lead();
    await assert.rejects(store.claim(input(l.id, other)), forbidden);
    await assert.rejects(store.latest(l.id, other), forbidden);
    await assert.rejects(store.claim(input("cmissing00000000000000000")), forbidden);
    assert.equal((await store.claim(input(l.id, admin))).kind, "acquired");
    assert.equal((await store.latest(l.id, owner))?.status, "RUNNING");
  });
  it("serializes concurrent requests to a single active run", async () => {
    const l = await lead();
    const claims = await Promise.all(Array.from({ length: 6 }, () => store.claim(input(l.id))));
    assert.equal(claims.filter((r) => r.kind === "acquired").length, 1);
    assert.equal(new Set(claims.map((r) => r.analysis.id)).size, 1);
    assert.equal(await db.leadAIAnalysis.count({ where: { leadId: l.id } }), 1);
  });
  it("enforces the pilot account inside the repository for reads, context and writes", async () => {
    const l = await lead();
    const actor = await db.user.findUniqueOrThrow({ where: { id: owner } });
    const previousId = process.env.LEAD_AI_ANALYSIS_ALLOWED_USER_ID;
    const previousEmail = process.env.LEAD_AI_ANALYSIS_ALLOWED_EMAIL;
    process.env.LEAD_AI_ANALYSIS_ALLOWED_USER_ID = owner;
    process.env.LEAD_AI_ANALYSIS_ALLOWED_EMAIL = actor.email;
    try {
      await assert.rejects(store.claim(input(l.id, admin)), forbidden);
      await assert.rejects(store.latest(l.id, admin), forbidden);
      await assert.rejects(store.context(l.id, admin), forbidden);
      const acquired = await store.claim(input(l.id));
      process.env.LEAD_AI_ANALYSIS_ALLOWED_EMAIL = "changed@example.test";
      await assert.rejects(store.finish(acquired.analysis.id, owner, terminal()), forbidden);
      assert.equal(await db.leadAIAnalysis.count({ where: { leadId: l.id } }), 1);
    } finally {
      if (previousId === undefined) delete process.env.LEAD_AI_ANALYSIS_ALLOWED_USER_ID;
      else process.env.LEAD_AI_ANALYSIS_ALLOWED_USER_ID = previousId;
      if (previousEmail === undefined) delete process.env.LEAD_AI_ANALYSIS_ALLOWED_EMAIL;
      else process.env.LEAD_AI_ANALYSIS_ALLOWED_EMAIL = previousEmail;
    }
  });
  it("partial unique index rejects a second RUNNING row even outside repository", async () => {
    const l = await lead(); await store.claim(input(l.id));
    await assert.rejects(db.leadAIAnalysis.create({ data: { leadId: l.id, requestedById: owner,
      requestKey: randomUUID(), expiresAt: new Date(Date.now() + 90_000) } }),
    (e: unknown) => typeof e === "object" && e !== null && "code" in e && e.code === "P2002");
  });
  it("replays completed idempotency keys and rejects reuse for a different lead", async () => {
    const l = await lead(); const request = input(l.id);
    const first = await store.claim(request); await store.finish(first.analysis.id, owner, terminal());
    const replay = await store.claim(request);
    assert.equal(replay.kind, "replay"); assert.equal(replay.analysis.id, first.analysis.id);
    const another = await lead();
    await assert.rejects(store.claim({ ...request, leadId: another.id }),
      (e: unknown) => e instanceof AnalysisAccessError && e.code === "CONFLICT");
  });
  it("expires abandoned runs and fences late results from replacing the successor", async () => {
    const l = await lead(); const first = await store.claim(input(l.id));
    await db.leadAIAnalysis.update({ where: { id: first.analysis.id }, data: { expiresAt: new Date(0) } });
    const second = await store.claim(input(l.id));
    assert.equal(second.kind, "acquired");
    await assert.rejects(store.finish(first.analysis.id, owner, terminal()),
      (e: unknown) => e instanceof AnalysisAccessError && e.code === "STALE_RUN");
    assert.equal((await db.leadAIAnalysis.findUniqueOrThrow({ where: { id: first.analysis.id } })).errorCode, "TIMEOUT");
    assert.equal((await db.leadAIAnalysis.findUniqueOrThrow({ where: { id: second.analysis.id } })).status, "RUNNING");
  });
  it("revalidates ownership at context fetch and result publication", async () => {
    const l = await lead(); const first = await store.claim(input(l.id));
    await db.lead.update({ where: { id: l.id }, data: { ownerId: other } });
    await assert.rejects(store.context(l.id, owner), forbidden);
    await assert.rejects(store.finish(first.analysis.id, owner, terminal()), forbidden);
    await assert.rejects(store.latest(l.id, owner), forbidden);
    assert.equal((await db.leadAIAnalysis.findUniqueOrThrow({ where: { id: first.analysis.id } })).report, null);
  });
  it("rechecks disabled users, required password change and current admin role", async () => {
    const l = await lead();
    await db.user.update({ where: { id: admin }, data: { role: "MEMBER" } });
    try { await assert.rejects(store.claim(input(l.id, admin)), forbidden); }
    finally { await db.user.update({ where: { id: admin }, data: { role: "ADMIN" } }); }
    for (const data of [{ isActive: false }, { mustChangePassword: true }]) {
      await db.user.update({ where: { id: owner }, data });
      try { await assert.rejects(store.claim(input(l.id)), forbidden); }
      finally { await db.user.update({ where: { id: owner }, data: { isActive: true, mustChangePassword: false } }); }
    }
  });
  it("context omits contact data, notes and raw intelligence", async () => {
    const l = await lead();
    assert.deepEqual(await store.context(l.id, owner), { leadId: l.id, companyName: l.companyName,
      website: null, source: "MANUAL", reputation: { signals: [] } });
  });
  it("runs the actual core with a simulated provider and persists independently", async () => {
    const l = await lead(); let completions = 0;
    const provider = createScriptedProvider({ respond: () => {
      completions++;
      if (completions === 1) return { type: "tool_calls", calls: [{ name: "getLeadContext", arguments: {} }] };
      return { type: "final", draft: { status: "INCONCLUSIVE", summary: null,
        digitalPresence: { hasPublicWebsite: false, observations: [] }, opportunities: [],
        insufficientInformation: ["No public website"], limitations: ["Simulated fixture"] } };
    } });
    const service = createAnalysisService({ store, enabled: () => true, runner: ({ leadId, source }) => runLeadAnalysis({
      leadId, source, provider, fetcher: { fetch: async () => { throw new Error("Network forbidden in this test"); } },
    }) });
    const request = { leadId: l.id, requestKey: randomUUID() };
    const outcome = await service.request(request, owner);
    assert.equal(outcome.ok && outcome.analysis?.status, "INCONCLUSIVE");
    const persisted = await db.leadAIAnalysis.findFirstOrThrow({ where: { leadId: l.id } });
    assert.ok(persisted.report); assert.ok(persisted.analysisRunId); assert.equal(persisted.toolCalls, 1);
    assert.equal((await service.request(request, owner)).ok, true); assert.equal(completions, 2);
    assert.deepEqual(await db.lead.findUniqueOrThrow({ where: { id: l.id } }), l);
  });
});
