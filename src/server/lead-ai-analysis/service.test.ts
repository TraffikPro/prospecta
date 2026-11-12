import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { createAnalysisService } from "./service";
import { AnalysisAccessError, type AnalysisStore, type AnalysisView } from "./contracts";
import type { AnalysisRunResult } from "../ai-analysis/orchestrator";
import { requestLeadAIAnalysisAction, getLeadAIAnalysisAction } from "../actions/lead-ai-analysis";

const leadId = "cmwdoqnd60008lwpwt3k9h5aa";
const row: AnalysisView = { id: "analysis-test", leadId, status: "RUNNING", report: null,
  errorCode: null, createdAt: new Date().toISOString(), finishedAt: null };
const result: AnalysisRunResult = { analysisRunId: randomUUID(), status: "FAILED", errorCode: "TIMEOUT",
  report: null, agentVersion: "test", model: "test", usage: { steps: 1, toolCalls: 0, tokens: 0, estimatedCostMicros: 0, durationMs: 1 }, trace: [] };
function fixture() {
  const calls: string[] = [];
  const store: AnalysisStore = {
    claim: async () => { calls.push("claim"); return { kind: "acquired", analysis: row }; },
    context: async () => { calls.push("context"); return { leadId }; },
    finish: async () => { calls.push("finish"); return { ...row, status: "FAILED" }; },
    fail: async () => { calls.push("fail"); },
    latest: async () => { calls.push("latest"); return row; },
  };
  return { calls, store, runner: async () => { calls.push("run"); return result; } };
}
describe("lead analysis service boundaries", () => {
  it("disabled Server Actions return before importing session/Prisma", async () => {
    const old = process.env.LEAD_AI_ANALYSIS_ENABLED;
    process.env.LEAD_AI_ANALYSIS_ENABLED = "false";
    try {
      assert.deepEqual(await requestLeadAIAnalysisAction({}), { ok: false, code: "AI_ANALYSIS_DISABLED" });
      assert.deepEqual(await getLeadAIAnalysisAction(leadId), { ok: false, code: "AI_ANALYSIS_DISABLED" });
    } finally {
      if (old === undefined) delete process.env.LEAD_AI_ANALYSIS_ENABLED;
      else process.env.LEAD_AI_ANALYSIS_ENABLED = old;
    }
  });
  it("disabled service performs no IO", async () => {
    const f = fixture(); const service = createAnalysisService({ ...f, enabled: () => false });
    assert.deepEqual(await service.request({}, "actor"), { ok: false, code: "AI_ANALYSIS_DISABLED" });
    assert.deepEqual(await service.latest(leadId, "actor"), { ok: false, code: "AI_ANALYSIS_DISABLED" });
    assert.deepEqual(f.calls, []);
  });
  it("rejects anonymous callers and forged actor fields without IO", async () => {
    const f = fixture(); const service = createAnalysisService({ ...f, enabled: () => true });
    assert.deepEqual(await service.request({}, null), { ok: false, code: "UNAUTHENTICATED" });
    assert.deepEqual(await service.request({ leadId, requestKey: randomUUID(), actorId: "admin" }, "actor"), { ok: false, code: "VALIDATION" });
    assert.deepEqual(f.calls, []);
  });
  it("unconfigured provider never creates a row or runs a simulation", async () => {
    const f = fixture(); const service = createAnalysisService({ ...f, runner: null, enabled: () => true });
    assert.deepEqual(await service.request({ leadId, requestKey: randomUUID() }, "actor"), { ok: false, code: "PROVIDER_NOT_CONFIGURED" });
    assert.deepEqual(f.calls, []);
  });
  it("forbidden lead never reaches the runner", async () => {
    const f = fixture(); f.store.claim = async () => { throw new AnalysisAccessError("FORBIDDEN"); };
    const response = await createAnalysisService({ ...f, enabled: () => true }).request({ leadId, requestKey: randomUUID() }, "actor");
    assert.deepEqual(response, { ok: false, code: "FORBIDDEN" }); assert.deepEqual(f.calls, []);
  });
  it("busy and replay requests do not invoke the runner", async () => {
    for (const kind of ["busy", "replay"] as const) {
      const f = fixture(); f.store.claim = async () => ({ kind, analysis: row });
      const response = await createAnalysisService({ ...f, enabled: () => true }).request({ leadId, requestKey: randomUUID() }, "actor");
      assert.equal(response.ok && response.kind, kind); assert.deepEqual(f.calls, []);
    }
  });
  it("pins context to the authorized lead", async () => {
    const f = fixture();
    const service = createAnalysisService({ ...f, enabled: () => true, runner: async ({ source }) => {
      assert.equal(await source.getById("forged"), null);
      assert.deepEqual(await source.getById(leadId), { leadId }); return result;
    } });
    assert.equal((await service.request({ leadId, requestKey: randomUUID() }, "actor")).ok, true);
    assert.deepEqual(f.calls, ["claim", "context", "finish"]);
  });
  it("sanitizes thrown errors and invalid reports, terminalizes owned run", async () => {
    for (const runner of [async () => { throw new Error("Bearer secret"); }, async () => ({ ...result, status: "COMPLETE" as const })]) {
      const f = fixture(); const service = createAnalysisService({ ...f, runner, enabled: () => true });
      assert.deepEqual(await service.request({ leadId, requestKey: randomUUID() }, "actor"), { ok: false, code: "INTERNAL" });
      assert.deepEqual(f.calls, ["claim", "fail"]);
    }
  });
});
