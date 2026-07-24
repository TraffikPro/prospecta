import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BREAK_GLASS_VALUE,
  assertSafeForMutableTests,
  databaseHostFingerprint,
} from "./production-mutation-guard";

const FAKE_PROD_HOST = "db.prod.example.test";
const FAKE_PROD_URL = `postgresql://u:p@${FAKE_PROD_HOST}/db`;
const FAKE_PROD_FP = databaseHostFingerprint(FAKE_PROD_URL)!;

describe("production mutation guard", () => {
  it("fingerprints database hosts stably", () => {
    const a = databaseHostFingerprint(FAKE_PROD_URL);
    const b = databaseHostFingerprint(
      `postgresql://other:x@${FAKE_PROD_HOST}/db?sslmode=require`,
    );
    assert.equal(typeof a, "string");
    assert.equal(a?.length, 12);
    assert.equal(a, b);
  });

  it("blocks known production database fingerprint", () => {
    const result = assertSafeForMutableTests({
      databaseUrl: FAKE_PROD_URL,
      knownDbFingerprints: [FAKE_PROD_FP],
    });
    assert.equal(result.ok, false);
  });

  it("blocks production app host", () => {
    const result = assertSafeForMutableTests({
      appUrl: "https://app.prod.example.test",
      knownAppHosts: ["app.prod.example.test"],
    });
    assert.equal(result.ok, false);
  });

  it("allows localhost targets", () => {
    const result = assertSafeForMutableTests({
      databaseUrl: "postgresql://u:p@localhost:5433/prospecta",
      appUrl: "http://127.0.0.1:3000",
      knownDbFingerprints: [FAKE_PROD_FP],
      knownAppHosts: ["app.prod.example.test"],
    });
    assert.equal(result.ok, true);
  });

  it("allows break-glass override", () => {
    const result = assertSafeForMutableTests({
      databaseUrl: FAKE_PROD_URL,
      appUrl: "https://app.prod.example.test",
      knownDbFingerprints: [FAKE_PROD_FP],
      knownAppHosts: ["app.prod.example.test"],
      breakGlass: BREAK_GLASS_VALUE,
    });
    assert.equal(result.ok, true);
  });
});
