import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIntelligenceInbox,
  countByQualification,
  parseInboxFilters,
} from "./inbox";

describe("parseInboxFilters", () => {
  it("defaults to ALL", () => {
    assert.deepEqual(parseInboxFilters({}), {
      qualification: "ALL",
      source: "ALL",
    });
  });

  it("accepts HIGH and GOOGLE_PLACES", () => {
    assert.deepEqual(
      parseInboxFilters({
        qualification: "HIGH",
        source: "GOOGLE_PLACES",
      }),
      { qualification: "HIGH", source: "GOOGLE_PLACES" },
    );
  });

  it("ignores unknown values", () => {
    assert.deepEqual(
      parseInboxFilters({ qualification: "LOW", source: "REFERRAL" }),
      { qualification: "ALL", source: "ALL" },
    );
  });
});

describe("buildIntelligenceInbox", () => {
  const leads = [
    {
      id: "1",
      companyName: "Clínica B",
      source: "GOOGLE_PLACES" as const,
      intelligence: {
        score: 80,
        signals: ["HIGH_RATING"],
        pitch: "Pitch B",
      },
    },
    {
      id: "2",
      companyName: "Clínica A",
      source: "GOOGLE_PLACES" as const,
      intelligence: {
        score: 90,
        signals: ["NO_WEBSITE"],
        diagnostic: "Sem site",
        pitch: "Pitch A",
      },
    },
    {
      id: "3",
      companyName: "Manual Co",
      source: "MANUAL" as const,
      intelligence: {
        score: 55,
        qualification: "MEDIUM" as const,
        signals: ["HIGH_REVIEWS"],
      },
    },
    {
      id: "4",
      companyName: "Sem score",
      source: "GOOGLE_PLACES" as const,
      intelligence: { signals: ["NO_WEBSITE"] },
    },
    {
      id: "5",
      companyName: "Vazio",
      source: "GOOGLE_PLACES" as const,
      intelligence: null,
    },
  ];

  it("sorts by score desc and skips incomplete intelligence", () => {
    const items = buildIntelligenceInbox(leads, {
      qualification: "ALL",
      source: "ALL",
    });
    assert.deepEqual(
      items.map((item) => item.companyName),
      ["Clínica A", "Clínica B", "Manual Co"],
    );
  });

  it("filters by HIGH and GOOGLE_PLACES", () => {
    const items = buildIntelligenceInbox(leads, {
      qualification: "HIGH",
      source: "GOOGLE_PLACES",
    });
    assert.deepEqual(
      items.map((item) => item.companyName),
      ["Clínica A", "Clínica B"],
    );
  });

  it("counts qualifications", () => {
    const items = buildIntelligenceInbox(leads, {
      qualification: "ALL",
      source: "ALL",
    });
    assert.deepEqual(countByQualification(items), {
      HIGH: 2,
      MEDIUM: 1,
      LOW: 0,
    });
  });
});
