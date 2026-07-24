import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMyQueue } from "./my-queue";

describe("buildMyQueue", () => {
  const now = new Date("2026-07-24T15:00:00.000Z");

  it("buckets no-contact before overdue and sorts by score", () => {
    const view = buildMyQueue(
      [
        {
          id: "a",
          companyName: "Baixo Score",
          stage: "NEW",
          nextFollowUpAt: null,
          intelligence: { score: 70, qualification: "MEDIUM", signals: ["x"] },
          activities: [],
        },
        {
          id: "b",
          companyName: "Alto Score",
          stage: "NEW",
          nextFollowUpAt: null,
          intelligence: {
            score: 90,
            qualification: "HIGH",
            signals: ["NO_WEBSITE"],
            diagnostic: "d",
            pitch: "p",
          },
          activities: [],
        },
        {
          id: "c",
          companyName: "Atrasado",
          stage: "CONTACTED",
          nextFollowUpAt: new Date("2026-07-20T12:00:00.000Z"),
          intelligence: {
            score: 95,
            qualification: "HIGH",
            signals: ["NO_WEBSITE"],
            diagnostic: "d",
            pitch: "p",
          },
          activities: [{ type: "WHATSAPP", outcome: "SENT_NO_REPLY" }],
        },
      ],
      now,
    );

    assert.equal(view.summary.noContact, 2);
    assert.equal(view.summary.overdue, 1);
    assert.equal(view.sections[0]?.bucket, "no_contact");
    assert.equal(view.sections[0]?.items[0]?.companyName, "Alto Score");
    assert.equal(view.sections[1]?.bucket, "overdue");
    assert.equal(
      view.sections[0]?.items[0]?.nextAction.actionLabel,
      "Fazer primeiro contato",
    );
  });
});
