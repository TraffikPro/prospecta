import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HIGH_ASSIGNMENT_CAP,
  MAX_WEEKLY_TARGET,
  MIN_WEEKLY_TARGET,
  RELEASE_REASON_ADMIN_REASSIGN,
  RELEASE_REASON_RECYCLED,
  RELEASE_REASON_WEEK_CLOSED,
  SUGGESTED_WEEKLY_TARGET,
  classifyHighPoolLead,
  countCommercialCycles,
  isEligibleHighPool,
  isRecyclableHigh,
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

const highIntelligence = {
  score: 90,
  qualification: "HIGH" as const,
  signals: ["NO_WEBSITE"],
};
const mediumIntelligence = {
  score: 55,
  qualification: "MEDIUM" as const,
  signals: [],
};

describe("countCommercialCycles", () => {
  it("counts one assignment as one cycle", () => {
    assert.equal(
      countCommercialCycles([{ status: "ACTIVE", releaseReason: null }]),
      1,
    );
    assert.equal(
      countCommercialCycles([{ status: "TREATED", releaseReason: null }]),
      1,
    );
  });

  it("does not count ADMIN_REASSIGN leftovers as a new cycle", () => {
    assert.equal(
      countCommercialCycles([
        {
          status: "RELEASED",
          releaseReason: RELEASE_REASON_ADMIN_REASSIGN,
        },
        { status: "ACTIVE", releaseReason: null },
      ]),
      1,
    );
  });

  it("does not count WEEK_CLOSED leftovers as a commercial cycle", () => {
    assert.equal(
      countCommercialCycles([
        {
          status: "RELEASED",
          releaseReason: RELEASE_REASON_WEEK_CLOSED,
        },
        { status: "ACTIVE", releaseReason: null },
      ]),
      1,
    );
  });

  it("still counts recycled history toward the cap", () => {
    assert.equal(
      countCommercialCycles([
        {
          status: "RELEASED",
          releaseReason: RELEASE_REASON_RECYCLED,
        },
        { status: "TREATED", releaseReason: null },
      ]),
      2,
    );
    assert.equal(HIGH_ASSIGNMENT_CAP, 2);
  });
});

describe("classifyHighPoolLead", () => {
  it("puts HIGH without assignment in the eligible pool", () => {
    assert.equal(
      classifyHighPoolLead({
        intelligence: highIntelligence,
        stage: "NEW",
        assignments: [],
      }),
      "eligible",
    );
    assert.equal(
      isEligibleHighPool({
        intelligence: highIntelligence,
        stage: "NEW",
        assignments: [],
      }),
      true,
    );
  });

  it("keeps ineligible leads out of the pool", () => {
    assert.equal(
      classifyHighPoolLead({
        intelligence: mediumIntelligence,
        stage: "NEW",
        assignments: [],
      }),
      null,
    );
    assert.equal(
      classifyHighPoolLead({
        intelligence: highIntelligence,
        stage: "WON",
        assignments: [],
      }),
      null,
    );
    assert.equal(
      classifyHighPoolLead({
        intelligence: highIntelligence,
        stage: "LOST",
        assignments: [],
      }),
      null,
    );
    assert.equal(
      classifyHighPoolLead({
        intelligence: highIntelligence,
        stage: "NEW",
        assignments: [{ status: "ACTIVE", releaseReason: null }],
      }),
      "assigned",
    );
    assert.equal(
      isEligibleHighPool({
        intelligence: highIntelligence,
        stage: "NEW",
        assignments: [{ status: "TREATED", releaseReason: null }],
      }),
      false,
    );
    assert.equal(
      classifyHighPoolLead({
        intelligence: highIntelligence,
        stage: "NEW",
        assignments: [
          { status: "RELEASED", releaseReason: RELEASE_REASON_RECYCLED },
          { status: "TREATED", releaseReason: null },
        ],
      }),
      "capped",
    );
  });

  it("does not list TREATED as eligible before explicit recycle", () => {
    const treated = {
      intelligence: highIntelligence,
      stage: "CONTACTED" as const,
      assignments: [{ status: "TREATED" as const, releaseReason: null }],
    };
    assert.equal(classifyHighPoolLead(treated), "recyclable");
    assert.equal(isRecyclableHigh(treated), true);
    assert.equal(isEligibleHighPool(treated), false);
  });

  it("lets HIGH released by WEEK_CLOSED return to the eligible pool", () => {
    assert.equal(
      classifyHighPoolLead({
        intelligence: highIntelligence,
        stage: "NEW",
        assignments: [
          {
            status: "RELEASED",
            releaseReason: RELEASE_REASON_WEEK_CLOSED,
          },
        ],
      }),
      "eligible",
    );
    assert.equal(
      isEligibleHighPool({
        intelligence: mediumIntelligence,
        stage: "NEW",
        assignments: [
          {
            status: "RELEASED",
            releaseReason: RELEASE_REASON_WEEK_CLOSED,
          },
        ],
      }),
      false,
    );
    assert.equal(
      classifyHighPoolLead({
        intelligence: highIntelligence,
        stage: "WON",
        assignments: [
          {
            status: "RELEASED",
            releaseReason: RELEASE_REASON_WEEK_CLOSED,
          },
        ],
      }),
      null,
    );
    assert.equal(
      classifyHighPoolLead({
        intelligence: highIntelligence,
        stage: "NEW",
        assignments: [
          { status: "RELEASED", releaseReason: RELEASE_REASON_RECYCLED },
          { status: "RELEASED", releaseReason: RELEASE_REASON_RECYCLED },
          {
            status: "RELEASED",
            releaseReason: RELEASE_REASON_WEEK_CLOSED,
          },
        ],
      }),
      "capped",
    );
  });
});
