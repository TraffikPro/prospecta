import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { qualificationFromScore } from "./qualification";

describe("lead detail intelligence presentation helpers", () => {
  it("keeps F6 score bands for detail context", () => {
    assert.equal(qualificationFromScore(70), "HIGH");
    assert.equal(qualificationFromScore(50), "MEDIUM");
    assert.equal(qualificationFromScore(49), "LOW");
  });
});
