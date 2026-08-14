import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  acquisitionJobCallbackSchema,
  acquisitionRequestSchema,
  normalizeAcquisitionFingerprint,
  parseWalletFillWeekStart,
  walletFillBatchSize,
  walletFillFingerprint,
} from "./acquisition.schema";

describe("acquisition.schema", () => {
  it("accepts a valid request", () => {
    const parsed = acquisitionRequestSchema.parse({
      city: "Santos SP",
      query: "clínica odontológica",
      limit: "10",
      campaign: "santos-odontologia-2026-07",
      confirmed: "on",
    });
    assert.equal(parsed.limit, 10);
    assert.equal(parsed.campaign, "santos-odontologia-2026-07");
  });

  it("rejects missing confirmation", () => {
    const result = acquisitionRequestSchema.safeParse({
      city: "Santos SP",
      query: "clínica odontológica",
      limit: 5,
      campaign: "santos-odontologia-2026-07",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid campaign slug", () => {
    const result = acquisitionRequestSchema.safeParse({
      city: "Santos SP",
      query: "odonto",
      limit: 5,
      campaign: "Santos Odontologia",
      confirmed: "on",
    });
    assert.equal(result.success, false);
  });

  it("normalizes fingerprint", () => {
    assert.equal(
      normalizeAcquisitionFingerprint({
        city: " Santos  SP ",
        query: "Clínica Odontológica",
        campaign: "santos-odontologia-2026-07",
      }),
      normalizeAcquisitionFingerprint({
        city: "santos sp",
        query: "clinica odontologica",
        campaign: "santos-odontologia-2026-07",
      }),
    );
  });

  it("parses callback payload", () => {
    const parsed = acquisitionJobCallbackSchema.parse({
      status: "SUCCEEDED",
      foundCount: 100,
      qualifiedCount: 30,
      createdTotal: 11,
      createdHigh: 11,
      existingCount: 6,
      failedCount: 0,
    });
    assert.equal(parsed.status, "SUCCEEDED");
    assert.equal(parsed.createdHigh, 11);
  });

  it("parses callback leadIds for wallet fill", () => {
    const parsed = acquisitionJobCallbackSchema.parse({
      status: "SUCCEEDED",
      requestedById: "user_1",
      leadIds: ["lead_a", "lead_b"],
      createdLeadIds: ["lead_a"],
      existingLeadIds: ["lead_b"],
    });
    assert.deepEqual(parsed.leadIds, ["lead_a", "lead_b"]);
    assert.equal(parsed.requestedById, "user_1");
  });
});

describe("walletFillBatchSize", () => {
  it("oversamples remaining slots within min/max", () => {
    assert.equal(walletFillBatchSize(0), 0);
    assert.equal(walletFillBatchSize(1), 4);
    assert.equal(walletFillBatchSize(3), 6);
    assert.equal(walletFillBatchSize(20), 30);
  });
});

describe("walletFillFingerprint week start", () => {
  it("round-trips an ISO week start", () => {
    const weekStartAt = new Date("2026-08-10T03:00:00.000Z");
    const fingerprint = walletFillFingerprint("user_1", weekStartAt);
    const parsed = parseWalletFillWeekStart(fingerprint);
    assert.equal(fingerprint, "fill|user_1|2026-08-10T03:00:00.000Z");
    assert.ok(parsed);
    assert.equal(parsed.toISOString(), weekStartAt.toISOString());
  });

  it("returns null for non-ISO fingerprints used in F3 tests", () => {
    assert.equal(parseWalletFillWeekStart("fill|user_1|callback-abc"), null);
    assert.equal(parseWalletFillWeekStart("free-pull-fp"), null);
  });
});
