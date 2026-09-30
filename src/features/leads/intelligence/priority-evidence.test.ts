import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPriorityEvidence } from "./priority-evidence";

describe("buildPriorityEvidence", () => {
  it("surfaces catalog signal labels and diagnostic, not pitch", () => {
    const evidence = buildPriorityEvidence({
      score: 91,
      qualification: "HIGH",
      signals: ["NO_WEBSITE", "HIGH_REVIEWS", "HIGH_RATING", "EXTRA"],
      diagnostic: "Sem website com volume de avaliações na região.",
      pitch: "Não deve aparecer na fila de prioridades.",
      rating: 4.8,
      reviews: 120,
    });

    assert.deepEqual(evidence.signalLabels, [
      "Website não identificado",
      "Volume relevante de avaliações",
      "Alta reputação no Google",
    ]);
    assert.match(evidence.reasonLine ?? "", /Sem website/);
    assert.match(evidence.placesLine ?? "", /Google/);
    assert.match(evidence.placesLine ?? "", /120/);
    assert.equal(evidence.reasonLine?.includes("Não deve"), false);
  });

  it("returns empty evidence when only score exists", () => {
    const evidence = buildPriorityEvidence({
      score: 70,
      signals: [],
    });
    assert.deepEqual(evidence.signalLabels, []);
    assert.equal(evidence.reasonLine, null);
    assert.equal(evidence.placesLine, null);
  });
});
