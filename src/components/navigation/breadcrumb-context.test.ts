import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLeadDetailHref,
  buildLeadReturnHref,
  leadBreadcrumbItems,
  parseLeadNavOrigin,
} from "./breadcrumb-context";

describe("lead navigation origin", () => {
  it("allowlists known origins and defaults to leads", () => {
    assert.equal(parseLeadNavOrigin("my-leads"), "my-leads");
    assert.equal(parseLeadNavOrigin("intelligence"), "intelligence");
    assert.equal(parseLeadNavOrigin("pipeline"), "pipeline");
    assert.equal(parseLeadNavOrigin("leads"), "leads");
    assert.equal(parseLeadNavOrigin("queue"), "my-leads");
    assert.equal(parseLeadNavOrigin("https://evil.example"), "leads");
    assert.equal(parseLeadNavOrigin("//evil"), "leads");
    assert.equal(parseLeadNavOrigin(undefined), "leads");
  });

  it("builds safe return hrefs and preserves my-leads filter", () => {
    assert.equal(buildLeadReturnHref("my-leads"), "/app/my-leads");
    assert.equal(
      buildLeadReturnHref("my-leads", "new"),
      "/app/my-leads?filter=new",
    );
    assert.equal(buildLeadReturnHref("intelligence"), "/app/intelligence");
    assert.equal(buildLeadReturnHref("pipeline"), "/app/pipeline");
    assert.equal(buildLeadReturnHref("leads"), "/app/leads");
  });

  it("builds lead detail href with from + filter", () => {
    assert.equal(
      buildLeadDetailHref("abc", "my-leads", "new"),
      "/app/leads/abc?from=my-leads&filter=new",
    );
    assert.equal(
      buildLeadDetailHref("abc", "intelligence"),
      "/app/leads/abc?from=intelligence",
    );
  });

  it("builds breadcrumb trail for contextual return", () => {
    const view = leadBreadcrumbItems("Comsorriso", "my-leads", "new");
    assert.equal(view.origin, "my-leads");
    assert.equal(view.returnHref, "/app/my-leads?filter=new");
    assert.deepEqual(view.items, [
      { label: "Minha fila", href: "/app/my-leads?filter=new" },
      { label: "Comsorriso" },
    ]);
  });
});
