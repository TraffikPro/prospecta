import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildMyQueue,
  formatCampaignLabel,
  parseMyQueueFilter,
} from "./my-queue";

describe("buildMyQueue", () => {
  const now = new Date("2026-07-24T15:00:00.000Z");

  it("prioritizes overdue before due-today before no-contact and sorts by score", () => {
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
            campaign: "santos-odontologia-2026-07",
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
        {
          id: "d",
          companyName: "Em Conversa",
          stage: "CONTACTED",
          nextFollowUpAt: new Date("2026-07-30T12:00:00.000Z"),
          intelligence: { score: 80, qualification: "HIGH", signals: ["x"] },
          activities: [{ type: "WHATSAPP", outcome: "REPLIED" }],
        },
      ],
      { now },
    );

    assert.equal(view.summary.noContact, 2);
    assert.equal(view.summary.overdue, 1);
    assert.equal(view.summary.inConversation, 1);
    assert.equal(view.sections[0]?.bucket, "overdue");
    assert.equal(view.sections[1]?.bucket, "no_contact");
    assert.equal(view.sections[1]?.items[0]?.companyName, "Alto Score");
    assert.equal(
      view.sections[1]?.items[0]?.campaign,
      "santos-odontologia-2026-07",
    );
    assert.equal(
      view.sections[1]?.items[0]?.nextAction.actionLabel,
      "Fazer primeiro contato",
    );
  });

  it("filters overdue and conversation", () => {
    const leads = [
      {
        id: "a",
        companyName: "Sem Contato",
        stage: "NEW" as const,
        nextFollowUpAt: null,
        intelligence: { score: 90, qualification: "HIGH" as const, signals: ["x"] },
        activities: [],
      },
      {
        id: "b",
        companyName: "Atrasado",
        stage: "CONTACTED" as const,
        nextFollowUpAt: new Date("2026-07-20T12:00:00.000Z"),
        intelligence: { score: 80, qualification: "HIGH" as const, signals: ["x"] },
        activities: [
          { type: "WHATSAPP" as const, outcome: "SENT_NO_REPLY" as const },
        ],
      },
      {
        id: "c",
        companyName: "Respondeu",
        stage: "CONTACTED" as const,
        nextFollowUpAt: new Date("2026-07-30T12:00:00.000Z"),
        intelligence: { score: 70, qualification: "MEDIUM" as const, signals: ["x"] },
        activities: [{ type: "WHATSAPP" as const, outcome: "REPLIED" as const }],
      },
    ];

    const overdue = buildMyQueue(leads, { now, filter: "overdue" });
    assert.equal(overdue.items.length, 1);
    assert.equal(overdue.items[0]?.companyName, "Atrasado");

    const conversation = buildMyQueue(leads, {
      now,
      filter: "conversation",
    });
    assert.equal(conversation.items.length, 1);
    assert.equal(conversation.items[0]?.companyName, "Respondeu");
  });
});

describe("my queue helpers", () => {
  it("parses filter query values", () => {
    assert.equal(parseMyQueueFilter("overdue"), "overdue");
    assert.equal(parseMyQueueFilter("new"), "new");
    assert.equal(parseMyQueueFilter("follow-up"), "follow-up");
    assert.equal(parseMyQueueFilter("conversation"), "conversation");
    assert.equal(parseMyQueueFilter("no_contact"), "new");
    assert.equal(parseMyQueueFilter("weird"), "all");
  });

  it("formats campaign slug for display", () => {
    assert.equal(
      formatCampaignLabel("santos-odontologia-2026-07"),
      "Santos Odontologia 2026-07",
    );
  });
});
