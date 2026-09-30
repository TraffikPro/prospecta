import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLeadInventoryWhere,
  leadInventoryHasActiveFilters,
  parseLeadInventoryFilters,
} from "./lead-inventory";

describe("parseLeadInventoryFilters", () => {
  it("parses q, stage, and owner", () => {
    assert.deepEqual(
      parseLeadInventoryFilters({
        q: "  Acme  ",
        stage: "CONTACTED",
        owner: "clxyz123",
      }),
      {
        q: "Acme",
        stage: "CONTACTED",
        ownerId: "clxyz123",
        page: 1,
      },
    );
  });

  it("rejects unknown stage and invalid owner tokens", () => {
    assert.deepEqual(parseLeadInventoryFilters({ stage: "NOPE", owner: "a b" }), {
      q: "",
      stage: "ALL",
      ownerId: null,
      page: 1,
    });
  });

  it("parses page and rejects non-positive values", () => {
    assert.equal(parseLeadInventoryFilters({ page: "3" }).page, 3);
    assert.equal(parseLeadInventoryFilters({ page: "0" }).page, 1);
    assert.equal(parseLeadInventoryFilters({ page: "nope" }).page, 1);
  });
});

describe("buildLeadInventoryWhere", () => {
  it("forces MEMBER owner scope and ignores client ownerId", () => {
    const where = buildLeadInventoryWhere({
      scope: { access: "owner", ownerId: "member-1" },
      filters: {
        q: "",
        stage: "ALL",
        ownerId: "someone-else",
        page: 1,
      },
    });
    assert.equal(where.ownerId, "member-1");
    assert.equal(where.stage, undefined);
  });

  it("applies ADMIN owner + stage + search OR", () => {
    const where = buildLeadInventoryWhere({
      scope: { access: "all" },
      filters: {
        q: "odont",
        stage: "NEW",
        ownerId: "owner-9",
        page: 2,
      },
    });
    assert.equal(where.ownerId, "owner-9");
    assert.equal(where.stage, "NEW");
    assert.ok(Array.isArray(where.OR));
    assert.equal(where.OR?.length, 4);
  });
});

describe("leadInventoryHasActiveFilters", () => {
  it("treats owner as inactive when owner filter is disabled", () => {
    assert.equal(
      leadInventoryHasActiveFilters(
        { q: "", stage: "ALL", ownerId: "x", page: 1 },
        { ownerFilterEnabled: false },
      ),
      false,
    );
    assert.equal(
      leadInventoryHasActiveFilters(
        { q: "", stage: "ALL", ownerId: "x", page: 1 },
        { ownerFilterEnabled: true },
      ),
      true,
    );
  });
});
