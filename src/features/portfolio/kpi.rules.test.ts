import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  aggregateWeeklyAssignmentKpis,
  countsTowardAssignedKpi,
  countsTowardPendingKpi,
  countsTowardTreatedKpi,
  countsTowardWeekClosedKpi,
  safeRate,
} from "./kpi.rules";
import {
  RELEASE_REASON_ADMIN_REASSIGN,
  RELEASE_REASON_RECYCLED,
  RELEASE_REASON_WEEK_CLOSED,
} from "./portfolio.rules";

describe("safeRate", () => {
  it("returns 0 when the denominator is 0 or non-finite", () => {
    assert.equal(safeRate(1, 0), 0);
    assert.equal(safeRate(3, -1), 0);
    assert.equal(safeRate(1, Number.POSITIVE_INFINITY), 0);
    assert.equal(safeRate(Number.NaN, 2), 0);
  });

  it("divides numerator by denominator in 0..1 scale", () => {
    assert.equal(safeRate(3, 4), 0.75);
    assert.equal(safeRate(0, 5), 0);
    assert.equal(safeRate(5, 5), 1);
  });
});

describe("assignment KPI classification", () => {
  it("counts ACTIVE and TREATED toward assigned; pending is ACTIVE only", () => {
    const active = {
      status: "ACTIVE" as const,
      source: "MANUAL_ADMIN" as const,
      releaseReason: null,
      treatedAt: null,
    };
    const treated = {
      status: "TREATED" as const,
      source: "NEW_ACQUISITION" as const,
      releaseReason: null,
      treatedAt: new Date("2026-08-12T12:00:00.000Z"),
    };
    assert.equal(countsTowardAssignedKpi(active), true);
    assert.equal(countsTowardPendingKpi(active), true);
    assert.equal(countsTowardTreatedKpi(active), false);
    assert.equal(countsTowardAssignedKpi(treated), true);
    assert.equal(countsTowardPendingKpi(treated), false);
    assert.equal(countsTowardTreatedKpi(treated), true);
  });

  it("does not count ADMIN_REASSIGN leftovers as assigned/treated/pending", () => {
    const leftover = {
      status: "RELEASED" as const,
      source: "MANUAL_ADMIN" as const,
      releaseReason: RELEASE_REASON_ADMIN_REASSIGN,
      treatedAt: null,
    };
    assert.equal(countsTowardAssignedKpi(leftover), false);
    assert.equal(countsTowardTreatedKpi(leftover), false);
    assert.equal(countsTowardPendingKpi(leftover), false);
  });

  it("keeps recycled-after-treatment as assigned+treated, not pending", () => {
    const recycled = {
      status: "RELEASED" as const,
      source: "MANUAL_ADMIN" as const,
      releaseReason: RELEASE_REASON_RECYCLED,
      treatedAt: new Date("2026-08-12T12:00:00.000Z"),
    };
    assert.equal(countsTowardAssignedKpi(recycled), true);
    assert.equal(countsTowardTreatedKpi(recycled), true);
    assert.equal(countsTowardPendingKpi(recycled), false);
  });

  it("counts WEEK_CLOSED as assigned backlog, not pending or treated", () => {
    const closed = {
      status: "RELEASED" as const,
      source: "NEW_ACQUISITION" as const,
      releaseReason: RELEASE_REASON_WEEK_CLOSED,
      treatedAt: null,
    };
    assert.equal(countsTowardAssignedKpi(closed), true);
    assert.equal(countsTowardPendingKpi(closed), false);
    assert.equal(countsTowardTreatedKpi(closed), false);
    assert.equal(countsTowardWeekClosedKpi(closed), true);
  });
});

describe("aggregateWeeklyAssignmentKpis fixture", () => {
  it("computes each field from mixed sources without double-counting transfers", () => {
    const treatedAt = new Date("2026-08-12T15:00:00.000Z");
    const counts = aggregateWeeklyAssignmentKpis([
      {
        status: "TREATED",
        source: "NEW_ACQUISITION",
        releaseReason: null,
        treatedAt,
      },
      {
        status: "ACTIVE",
        source: "NEW_ACQUISITION",
        releaseReason: null,
        treatedAt: null,
      },
      {
        status: "TREATED",
        source: "RECYCLED",
        releaseReason: null,
        treatedAt,
      },
      {
        status: "ACTIVE",
        source: "MANUAL_ADMIN",
        releaseReason: null,
        treatedAt: null,
      },
      {
        status: "RELEASED",
        source: "MANUAL_ADMIN",
        releaseReason: RELEASE_REASON_ADMIN_REASSIGN,
        treatedAt: null,
      },
      {
        status: "RELEASED",
        source: "NEW_ACQUISITION",
        releaseReason: RELEASE_REASON_WEEK_CLOSED,
        treatedAt: null,
      },
      {
        status: "RELEASED",
        source: "ENROLL_OWNED",
        releaseReason: RELEASE_REASON_RECYCLED,
        treatedAt,
      },
    ]);

    assert.equal(counts.assigned, 6);
    assert.equal(counts.treated, 3);
    assert.equal(counts.pending, 2);
    assert.equal(counts.bySource.newAcquisition, 3);
    assert.equal(counts.bySource.recycled, 1);
    assert.equal(counts.bySource.adminReassigned, 1);
    assert.equal(counts.bySource.other, 2);
    assert.equal(counts.released.weekClosed, 1);
    assert.ok(counts.treated <= counts.assigned);
    assert.ok(counts.pending <= counts.assigned);
  });
});
