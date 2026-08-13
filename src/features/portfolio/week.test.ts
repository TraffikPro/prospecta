import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatWeekRangePtBr,
  getOperationalWeek,
  zonedSaoPauloToUtc,
} from "./week";

describe("zonedSaoPauloToUtc", () => {
  it("maps Monday 00:00 SP (UTC-3) to 03:00 UTC", () => {
    const utc = zonedSaoPauloToUtc({
      year: 2026,
      month: 8,
      day: 10,
      hour: 0,
      minute: 0,
      second: 0,
      ms: 0,
    });
    assert.equal(utc.toISOString(), "2026-08-10T03:00:00.000Z");
  });

  it("maps Sunday 23:59:59.999 SP to Monday 02:59:59.999 UTC", () => {
    const utc = zonedSaoPauloToUtc({
      year: 2026,
      month: 8,
      day: 16,
      hour: 23,
      minute: 59,
      second: 59,
      ms: 999,
    });
    assert.equal(utc.toISOString(), "2026-08-17T02:59:59.999Z");
  });
});

describe("getOperationalWeek", () => {
  it("bounds mid-week SP time to Mon–Sun of that week", () => {
    // 2026-08-12 15:00 SP = 18:00 UTC (Wed)
    const week = getOperationalWeek(new Date("2026-08-12T18:00:00.000Z"));
    assert.equal(week.weekStartAt.toISOString(), "2026-08-10T03:00:00.000Z");
    assert.equal(week.weekEndAt.toISOString(), "2026-08-17T02:59:59.999Z");
  });

  it("keeps Sunday evening inside the same week", () => {
    // 2026-08-16 22:00 SP = 2026-08-17 01:00 UTC
    const week = getOperationalWeek(new Date("2026-08-17T01:00:00.000Z"));
    assert.equal(week.weekStartAt.toISOString(), "2026-08-10T03:00:00.000Z");
    assert.equal(week.weekEndAt.toISOString(), "2026-08-17T02:59:59.999Z");
  });

  it("rolls after Sunday 23:59:59.999 SP", () => {
    const week = getOperationalWeek(new Date("2026-08-17T03:00:00.000Z"));
    assert.equal(week.weekStartAt.toISOString(), "2026-08-17T03:00:00.000Z");
    assert.equal(week.weekEndAt.toISOString(), "2026-08-24T02:59:59.999Z");
  });
});

describe("formatWeekRangePtBr", () => {
  it("returns a non-empty label for the week", () => {
    const week = getOperationalWeek(new Date("2026-08-12T18:00:00.000Z"));
    const label = formatWeekRangePtBr(week);
    assert.ok(label.includes("–") || label.includes("-"));
    assert.ok(label.length > 5);
  });
});
