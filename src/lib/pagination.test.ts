import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clampPage, parsePageParam } from "./pagination";

describe("parsePageParam", () => {
  it("defaults invalid values to 1", () => {
    assert.equal(parsePageParam(undefined), 1);
    assert.equal(parsePageParam("0"), 1);
    assert.equal(parsePageParam("-2"), 1);
    assert.equal(parsePageParam("abc"), 1);
  });

  it("parses positive integers", () => {
    assert.equal(parsePageParam("4"), 4);
    assert.equal(parsePageParam(["7"]), 7);
  });
});

describe("clampPage", () => {
  it("clamps beyond last page and computes skip/take", () => {
    const result = clampPage(99, 60, 25);
    assert.deepEqual(result, {
      page: 3,
      totalPages: 3,
      skip: 50,
      take: 25,
    });
  });

  it("keeps page 1 for empty sets", () => {
    const result = clampPage(5, 0, 25);
    assert.deepEqual(result, {
      page: 1,
      totalPages: 1,
      skip: 0,
      take: 25,
    });
  });
});
