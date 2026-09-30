import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PORTFOLIO_CATALOG } from "./portfolio.catalog";
import {
  DEMOS_PAGE_META,
  DEMO_OPEN_LABEL,
  resolveDemoCoverKind,
  summarizeDemoFeatures,
} from "./demo-presentation";

const BANNED = [
  "experiência incrível",
  "transforme seu negócio",
  "potencialize",
  "solução inteligente",
  "revolucione",
];

describe("demo-presentation", () => {
  it("opens demos with a direct CTA label", () => {
    assert.equal(DEMO_OPEN_LABEL, "Abrir demo");
  });

  it("keeps page meta free of generic marketing fragments", () => {
    const hay = DEMOS_PAGE_META.toLowerCase();
    for (const fragment of BANNED) {
      assert.equal(hay.includes(fragment), false, fragment);
    }
  });

  it("summarizes long feature lists without inventing labels", () => {
    assert.deepEqual(summarizeDemoFeatures(["A", "B"], 4), {
      visible: ["A", "B"],
      overflow: 0,
    });
    assert.deepEqual(
      summarizeDemoFeatures(["A", "B", "C", "D", "E"], 4),
      { visible: ["A", "B", "C", "D"], overflow: 1 },
    );
  });

  it("uses typographic covers when no coverImage is published", () => {
    for (const model of PORTFOLIO_CATALOG) {
      assert.equal(resolveDemoCoverKind(model), "typographic");
    }
  });

  it("keeps catalog copy free of banned marketing fragments", () => {
    const hay = PORTFOLIO_CATALOG.map((m) => `${m.title} ${m.description}`)
      .join(" ")
      .toLowerCase();
    for (const fragment of BANNED) {
      assert.equal(hay.includes(fragment), false, fragment);
    }
  });
});
