import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PORTFOLIO_CATALOG } from "./portfolio.catalog";
import {
  filterPortfolioCatalog,
  parsePortfolioNicheFilter,
  portfolioFilterHref,
} from "./portfolio.filter";

describe("parsePortfolioNicheFilter", () => {
  it("defaults to ALL", () => {
    assert.equal(parsePortfolioNicheFilter(undefined), "ALL");
  });

  it("accepts known niches", () => {
    assert.equal(parsePortfolioNicheFilter("DENTISTRY"), "DENTISTRY");
  });

  it("falls back on unknown values", () => {
    assert.equal(parsePortfolioNicheFilter("UNKNOWN"), "ALL");
  });
});

describe("filterPortfolioCatalog", () => {
  it("returns all models for ALL", () => {
    assert.equal(
      filterPortfolioCatalog(PORTFOLIO_CATALOG, "ALL").length,
      PORTFOLIO_CATALOG.length,
    );
  });

  it("filters by niche", () => {
    const dentistry = filterPortfolioCatalog(PORTFOLIO_CATALOG, "DENTISTRY");
    assert.equal(dentistry.length, 3);
    assert.ok(dentistry.every((item) => item.niche === "DENTISTRY"));
  });

  it("returns empty for niches without models", () => {
    assert.deepEqual(filterPortfolioCatalog(PORTFOLIO_CATALOG, "LAW"), []);
  });
});

describe("portfolioFilterHref", () => {
  it("builds query for niche filter", () => {
    assert.equal(
      portfolioFilterHref("DENTISTRY"),
      "/app/portfolio?niche=DENTISTRY",
    );
    assert.equal(portfolioFilterHref("ALL"), "/app/portfolio");
  });
});
