import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseLeadIntelligence } from "./parse-intelligence";
import { resolveQualification, qualificationLabel } from "./qualification";
import { sanitizeLeadNotes } from "./sanitize-notes";
import {
  dedupeSignals,
  normalizeSignalCode,
  signalLabel,
} from "./signal-catalog";

describe("parseLeadIntelligence", () => {
  it("parses complete JSON", () => {
    const parsed = parseLeadIntelligence({
      score: 90,
      qualification: "HIGH",
      signals: ["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"],
      diagnostic: "Empresa tem oportunidade clara de presença digital.",
      pitch: "Olá, encontrei a clínica de vocês...",
      rating: 4.8,
      reviews: 186,
      googleMapsUrl: "https://maps.google.com/?cid=123",
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
    assert.equal(parsed.rating, 4.8);
    assert.equal(parsed.reviews, 186);
    assert.equal(parsed.googleMapsUrl, "https://maps.google.com/?cid=123");
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

  it("normalizes aliases and dedupes equivalent signals", () => {
    const parsed = parseLeadIntelligence({
      score: 90,
      signals: [
        "HIGH_REPUTATION",
        "HIGH_RATING",
        "high reputation",
        "NO_WEBSITE",
        "NO_WEBSITE",
      ],
    });

    assert.ok(parsed);
    assert.deepEqual(parsed.signals, ["HIGH_RATING", "NO_WEBSITE"]);
  });

  it("rejects invalid Places evidence", () => {
    const parsed = parseLeadIntelligence({
      score: 80,
      rating: 6,
      reviews: -1,
      googleMapsUrl: "not-a-url",
      signals: ["HIGH_RATING"],
    });

    assert.ok(parsed);
    assert.equal(parsed.rating, undefined);
    assert.equal(parsed.reviews, undefined);
    assert.equal(parsed.googleMapsUrl, undefined);
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

describe("qualificationLabel", () => {
  it("uses Prioridade labels in Portuguese", () => {
    assert.equal(qualificationLabel("HIGH"), "Prioridade alta");
    assert.equal(qualificationLabel("MEDIUM"), "Prioridade média");
    assert.equal(qualificationLabel("LOW"), "Prioridade baixa");
  });
});

describe("signal catalog", () => {
  it("maps known signals to standardized Portuguese copy", () => {
    assert.equal(signalLabel("NO_WEBSITE"), "Website não identificado");
    assert.equal(signalLabel("HIGH_RATING"), "Alta reputação no Google");
    assert.equal(signalLabel("HIGH_REVIEWS"), "Volume relevante de avaliações");
  });

  it("aliases HIGH_REPUTATION to HIGH_RATING label", () => {
    assert.equal(normalizeSignalCode("HIGH_REPUTATION"), "HIGH_RATING");
    assert.equal(signalLabel("HIGH_REPUTATION"), "Alta reputação no Google");
  });

  it("never returns raw SCREAMING_SNAKE for known aliases", () => {
    for (const code of [
      "HIGH_REPUTATION",
      "HIGH_RATING",
      "NO_WEBSITE",
      "HIGH_REVIEWS",
    ]) {
      const label = signalLabel(code);
      assert.equal(label.includes("_"), false);
      assert.notEqual(label, code);
    }
  });

  it("dedupes after alias normalization", () => {
    assert.deepEqual(
      dedupeSignals(["HIGH_REPUTATION", "HIGH_RATING", "HIGH_REVIEWS", "HIGH_REVIEWS"]),
      ["HIGH_RATING", "HIGH_REVIEWS"],
    );
  });

  it("gives readable fallback for unknown codes", () => {
    assert.equal(signalLabel("CUSTOM_SIGNAL"), "Custom signal");
  });
});

describe("sanitizeLeadNotes", () => {
  it("removes technical signal codes from free text", () => {
    const result = sanitizeLeadNotes(
      "Lead forte. HIGH_REPUTATION e HIGH_RATING confirmados.",
      { signals: ["HIGH_RATING"] },
    );
    assert.ok(result);
    assert.equal(result.includes("HIGH_REPUTATION"), false);
    assert.equal(result.includes("HIGH_RATING"), false);
    assert.match(result, /Lead forte/);
  });

  it("strips structured Places notes when evidence and signals already cover them", () => {
    const result = sanitizeLeadNotes(
      "rating=4.8; reviews=320; reason=Sem website",
      {
        signals: ["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"],
        rating: 4.8,
        reviews: 320,
      },
    );
    assert.equal(result, null);
  });

  it("strips auto-generated score/diagnostic/pitch duplicates", () => {
    const diagnostic = "Empresa tem oportunidade clara de presença digital.";
    const pitch = "Olá, encontrei a clínica de vocês...";
    const result = sanitizeLeadNotes(
      `Score: 90/100\n${diagnostic}\nPitch: ${pitch}`,
      { score: 90, diagnostic, pitch, signals: ["NO_WEBSITE"] },
    );
    assert.equal(result, null);
  });

  it("keeps additional commercial context", () => {
    const result = sanitizeLeadNotes(
      "Sócia pediu retorno após feriado.",
      { signals: ["NO_WEBSITE"], score: 90 },
    );
    assert.equal(result, "Sócia pediu retorno após feriado.");
  });
});
