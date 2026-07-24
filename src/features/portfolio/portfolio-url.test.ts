import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toAbsolutePortfolioUrl } from "./portfolio-url";

describe("toAbsolutePortfolioUrl", () => {
  it("keeps absolute https URLs", () => {
    assert.equal(
      toAbsolutePortfolioUrl("https://demo.example/x"),
      "https://demo.example/x",
    );
  });

  it("prefers appUrl over origin", () => {
    assert.equal(
      toAbsolutePortfolioUrl("/portfolio/odontologia-familiar/", {
        appUrl: "https://prospecta-ten-tau.vercel.app",
        origin: "http://127.0.0.1:3000",
      }),
      "https://prospecta-ten-tau.vercel.app/portfolio/odontologia-familiar/",
    );
  });

  it("falls back to origin when appUrl is missing", () => {
    assert.equal(
      toAbsolutePortfolioUrl("/portfolio/odontologia-premium/", {
        origin: "http://127.0.0.1:3000",
      }),
      "http://127.0.0.1:3000/portfolio/odontologia-premium/",
    );
  });
});
