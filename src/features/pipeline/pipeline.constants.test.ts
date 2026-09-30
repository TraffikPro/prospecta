import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { LEAD_STAGE_ORDER } from "@/features/leads/lead.labels";
import {
  PIPELINE_PAGE_SIZE,
  PIPELINE_STAGE_PREVIEW_SIZE,
} from "@/features/pipeline/pipeline.constants";

describe("pipeline presentation constants", () => {
  it("keeps stage order including terminal WON/LOST", () => {
    assert.deepEqual(LEAD_STAGE_ORDER, [
      "NEW",
      "QUALIFIED",
      "CONTACTED",
      "MEETING",
      "WON",
      "LOST",
    ]);
  });

  it("uses denser preview with paginated selected stage", () => {
    assert.equal(PIPELINE_PAGE_SIZE, 25);
    assert.equal(PIPELINE_STAGE_PREVIEW_SIZE, 8);
    assert.ok(PIPELINE_STAGE_PREVIEW_SIZE < PIPELINE_PAGE_SIZE);
  });
});
