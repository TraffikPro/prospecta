import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatQueueFollowUp, relativeFollowUpLabel } from "./format-follow-up";

describe("formatQueueFollowUp", () => {
  const now = new Date(2026, 9, 6, 11, 0, 0);

  it("pairs a relative label with the exact calendar date", () => {
    const today = new Date(2026, 9, 6, 14, 30, 0);
    assert.match(formatQueueFollowUp(today, now), /Hoje /);
    assert.match(formatQueueFollowUp(today, now), /06\/10\/2026|6\/10\/2026/);
  });

  it("labels overdue and upcoming days without dropping the exact date", () => {
    const yesterday = new Date(2026, 9, 5, 9, 0, 0);
    assert.match(relativeFollowUpLabel(yesterday, now) ?? "", /^Ontem /);
    assert.match(formatQueueFollowUp(yesterday, now), /Ontem /);

    const inTwo = new Date(2026, 9, 8, 10, 0, 0);
    assert.equal(relativeFollowUpLabel(inTwo, now), "Em 2 dias");
  });

  it("returns a stable empty label", () => {
    assert.equal(formatQueueFollowUp(null, now), "Sem follow-up");
  });
});
