import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  followUpPresetDate,
  followUpPresetUnavailableReason,
  isFollowUpPresetAvailable,
  toDatetimeLocalValue,
} from "./follow-up-presets";

describe("follow-up presets", () => {
  const morning = new Date(2026, 9, 6, 11, 41, 30);
  const evening = new Date(2026, 9, 6, 18, 30, 0);

  it("fills local datetime without shifting the clock into UTC strings", () => {
    assert.equal(toDatetimeLocalValue(morning), "2026-10-06T11:41");
  });

  it("maps preset ids to local calendar slots", () => {
    assert.equal(
      toDatetimeLocalValue(followUpPresetDate("today-18", morning)),
      "2026-10-06T18:00",
    );
    assert.equal(
      toDatetimeLocalValue(followUpPresetDate("tomorrow-10", morning)),
      "2026-10-07T10:00",
    );
    assert.equal(
      toDatetimeLocalValue(followUpPresetDate("plus-2d-10", morning)),
      "2026-10-08T10:00",
    );
  });

  it("disables Hoje 18:00 after that time without swapping to tomorrow", () => {
    assert.equal(isFollowUpPresetAvailable("today-18", morning), true);
    assert.equal(isFollowUpPresetAvailable("today-18", evening), false);
    assert.equal(
      followUpPresetUnavailableReason("today-18", evening),
      "Horário de hoje já passou",
    );
    assert.equal(
      toDatetimeLocalValue(followUpPresetDate("today-18", evening)),
      "2026-10-06T18:00",
    );
    assert.equal(isFollowUpPresetAvailable("tomorrow-10", evening), true);
  });
});
