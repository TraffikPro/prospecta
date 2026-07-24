import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseLeadIntelligence } from "./parse-intelligence";
import { resolveQualification } from "./qualification";
import { signalLabel } from "./signal-labels";

describe("parseLeadIntelligence", () => {
  it("parses complete JSON", () => {
    const parsed = parseLeadIntelligence({
      score: 90,
      qualification: "HIGH",
      signals: ["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"],
      diagnostic: "Empresa tem oportunidade clara de presença digital.",
      pitch: "Olá, encontrei a clínica de vocês...",
    });

    assert.ok(parsed);
    assert.equal(parsed.score, 90);
    assert.equal(parsed.qualification, "HIGH");
    assert.deepEqual(parsed.signals, [
      "NO_WEBSITE",
      "HIGH_RATING",
      "HIGH_REVIEWS",
    ]);
    assert.match(parsed.diagnostic ?? "", /presença digital/);
    assert.match(parsed.pitch ?? "", /clínica/);
  });

  it("returns null for empty JSON", () => {
    assert.equal(parseLeadIntelligence({}), null);
    assert.equal(parseLeadIntelligence(null), null);
    assert.equal(parseLeadIntelligence(undefined), null);
    assert.equal(parseLeadIntelligence([]), null);
  });

  it("accepts legacy summary as diagnostic", () => {
    const parsed = parseLeadIntelligence({
      score: 75,
      summary: "Legado: resumo antigo",
      signals: ["NO_WEBSITE"],
    });

    assert.ok(parsed);
    assert.equal(parsed.diagnostic, "Legado: resumo antigo");
    assert.equal(parsed.score, 75);
  });

  it("ignores invalid score and unknown noise", () => {
    const parsed = parseLeadIntelligence({
      score: 150,
      signals: ["NO_WEBSITE", 42, "", "HIGH_REVIEWS"],
      extra: { nested: true },
    });

    assert.ok(parsed);
    assert.equal(parsed.score, undefined);
    assert.deepEqual(parsed.signals, ["NO_WEBSITE", "HIGH_REVIEWS"]);
  });
});

describe("resolveQualification", () => {
  it("derives HIGH / MEDIUM / LOW from score", () => {
    assert.equal(resolveQualification({ signals: [], score: 70 }), "HIGH");
    assert.equal(resolveQualification({ signals: [], score: 50 }), "MEDIUM");
    assert.equal(resolveQualification({ signals: [], score: 49 }), "LOW");
  });

  it("prefers explicit qualification over score", () => {
    assert.equal(
      resolveQualification({ signals: [], score: 90, qualification: "LOW" }),
      "LOW",
    );
  });
});

describe("signalLabel", () => {
  it("maps known signals to Portuguese copy", () => {
    assert.equal(signalLabel("NO_WEBSITE"), "Sem website identificado");
    assert.equal(signalLabel("HIGH_RATING"), "Alta reputação Google");
    assert.equal(signalLabel("HIGH_REVIEWS"), "Volume relevante de avaliações");
  });
});
