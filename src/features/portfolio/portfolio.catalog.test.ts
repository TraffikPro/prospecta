import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  listAvailableNiches,
  PORTFOLIO_CATALOG,
} from "./portfolio.catalog";
import { portfolioCatalogSchema } from "./portfolio.schema";

describe("PORTFOLIO_CATALOG", () => {
  it("validates against zod schema", () => {
    const parsed = portfolioCatalogSchema.safeParse(PORTFOLIO_CATALOG);
    assert.equal(parsed.success, true);
  });

  it("ships three dentistry demonstrative models", () => {
    assert.equal(PORTFOLIO_CATALOG.length, 3);
    assert.ok(PORTFOLIO_CATALOG.every((item) => item.niche === "DENTISTRY"));
  });

  it("uses public index.html paths under /portfolio/", () => {
    for (const item of PORTFOLIO_CATALOG) {
      assert.match(item.previewUrl, /^\/portfolio\/.+\/index\.html$/);
    }
  });

  it("lists only niches that have models", () => {
    assert.deepEqual(listAvailableNiches(), ["DENTISTRY"]);
  });
});
