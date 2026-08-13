import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_WEEKLY_TARGET,
  MIN_WEEKLY_TARGET,
  SUGGESTED_WEEKLY_TARGET,
  isValidTreatmentActivity,
} from "./portfolio.rules";

describe("weekly target constants", () => {
  it("exposes SUGGESTED / MIN / MAX (suggested is form-only, not implicit meta)", () => {
    assert.equal(SUGGESTED_WEEKLY_TARGET, 10);
    assert.equal(MIN_WEEKLY_TARGET, 1);
    assert.equal(MAX_WEEKLY_TARGET, 50);
  });
});

describe("isValidTreatmentActivity", () => {
  const assignedAt = new Date("2026-08-10T12:00:00.000Z");
  const after = new Date("2026-08-11T12:00:00.000Z");
  const before = new Date("2026-08-09T12:00:00.000Z");

  it("accepts WHATSAPP/EMAIL with outcome after assignment by assignee", () => {
    assert.equal(
      isValidTreatmentActivity({
        type: "WHATSAPP",
        outcome: "INTERESTED",
        activityCreatedAt: after,
        assignedAt,
        authorId: "op-1",
        assigneeId: "op-1",
      }),
      true,
    );
    assert.equal(
      isValidTreatmentActivity({
        type: "EMAIL",
        outcome: "NOT_INTERESTED",
        activityCreatedAt: after,
        assignedAt,
        authorId: "op-1",
        assigneeId: "op-1",
      }),
      true,
    );
  });

  it("rejects NOTE and STAGE_CHANGE", () => {
    assert.equal(
      isValidTreatmentActivity({
        type: "NOTE",
        outcome: "OTHER",
        activityCreatedAt: after,
        assignedAt,
        authorId: "op-1",
        assigneeId: "op-1",
      }),
      false,
    );
    assert.equal(
      isValidTreatmentActivity({
        type: "STAGE_CHANGE",
        outcome: "INTERESTED",
        activityCreatedAt: after,
        assignedAt,
        authorId: "op-1",
        assigneeId: "op-1",
      }),
      false,
    );
  });

  it("rejects outreach without outcome, before assignment, or wrong author", () => {
    assert.equal(
      isValidTreatmentActivity({
        type: "WHATSAPP",
        outcome: null,
        activityCreatedAt: after,
        assignedAt,
        authorId: "op-1",
        assigneeId: "op-1",
      }),
      false,
    );
    assert.equal(
      isValidTreatmentActivity({
        type: "WHATSAPP",
        outcome: "SENT_NO_REPLY",
        activityCreatedAt: before,
        assignedAt,
        authorId: "op-1",
        assigneeId: "op-1",
      }),
      false,
    );
    assert.equal(
      isValidTreatmentActivity({
        type: "EMAIL",
        outcome: "REPLIED",
        activityCreatedAt: after,
        assignedAt,
        authorId: "other",
        assigneeId: "op-1",
      }),
      false,
    );
  });
});
