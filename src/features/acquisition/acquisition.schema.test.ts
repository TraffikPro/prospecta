import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  acquisitionJobCallbackSchema,
  acquisitionRequestSchema,
  normalizeAcquisitionFingerprint,
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
});
