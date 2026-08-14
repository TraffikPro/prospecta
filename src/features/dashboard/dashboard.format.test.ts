import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatPercent, rateToProgressValue } from "./dashboard.format";

describe("formatPercent", () => {
  it("formats canonical 0..1 rates in pt-BR without persisting a string", () => {
    assert.equal(formatPercent(0), "0%");
    assert.equal(formatPercent(0.75), "75%");
    assert.equal(formatPercent(1), "100%");
    assert.equal(formatPercent(0.5), "50%");
  });
});

describe("rateToProgressValue", () => {
  it("maps 0..1 onto a 0–100 bar without inventing a new rate", () => {
    assert.equal(rateToProgressValue(0), 0);
    assert.equal(rateToProgressValue(0.75), 75);
    assert.equal(rateToProgressValue(1), 100);
    assert.equal(rateToProgressValue(-1), 0);
    assert.equal(rateToProgressValue(2), 100);
  });
});
