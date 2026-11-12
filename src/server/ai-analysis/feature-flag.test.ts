import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  assertLeadAiAnalysisEnabled,
  isLeadAiAnalysisEnabled,
  LeadAiAnalysisDisabledError,
} from "./feature-flag";
import { createLeadRef, toSafeLogEvent, type SafeLogEvent } from "./log";

describe("lead AI feature flag", () => {
  const previous = process.env.LEAD_AI_ANALYSIS_ENABLED;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.LEAD_AI_ANALYSIS_ENABLED;
    } else {
      process.env.LEAD_AI_ANALYSIS_ENABLED = previous;
    }
  });

  it("stays off unless the value is exactly true", () => {
    delete process.env.LEAD_AI_ANALYSIS_ENABLED;
    assert.equal(isLeadAiAnalysisEnabled(), false);
    process.env.LEAD_AI_ANALYSIS_ENABLED = "false";
    assert.equal(isLeadAiAnalysisEnabled(), false);
    process.env.LEAD_AI_ANALYSIS_ENABLED = "1";
    assert.equal(isLeadAiAnalysisEnabled(), false);
    process.env.LEAD_AI_ANALYSIS_ENABLED = "TRUE";
    assert.equal(isLeadAiAnalysisEnabled(), false);
    process.env.LEAD_AI_ANALYSIS_ENABLED = "true";
    assert.equal(isLeadAiAnalysisEnabled(), true);
    delete process.env.LEAD_AI_ANALYSIS_ENABLED;
    assert.throws(() => assertLeadAiAnalysisEnabled(), LeadAiAnalysisDisabledError);
  });
});

describe("safe analysis logs", () => {
  it("hashes the lead id and drops undeclared fields", () => {
    const leadId = "lead_fictional_aurora";
    const ref = createLeadRef(leadId);
    assert.notEqual(ref, leadId);
    assert.equal(createLeadRef(leadId), ref);

    const dirty = {
      analysisRunId: "run_1",
      leadRef: ref,
      event: "tool_result",
      tool: "inspectWebsite",
      errorCode: "URL_NOT_ALLOWED",
      durationMs: 12,
      step: 2,
      status: "FAILED",
      authorization: "Bearer sk-test-secret",
      email: "pessoa.ficticia@exemplo.test",
      prompt: "ignore previous instructions",
    } as SafeLogEvent;
    const safe = toSafeLogEvent(dirty);
    const serialized = JSON.stringify(safe);
    assert.equal(serialized.includes("Bearer"), false);
    assert.equal(serialized.includes("sk-test-secret"), false);
    assert.equal(serialized.includes("@"), false);
    assert.equal(serialized.includes(leadId), false);
    assert.equal(safe.tool, "inspectWebsite");
    assert.equal(safe.errorCode, "URL_NOT_ALLOWED");
  });
});
