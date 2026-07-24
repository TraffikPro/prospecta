import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyFollowUp,
  getNextAction,
  pickLatestOutcome,
} from "./next-action";

describe("getNextAction", () => {
  const now = new Date("2026-07-24T15:00:00.000Z");

  it("recommends first contact when there is no activity", () => {
    const view = getNextAction({
      stage: "NEW",
      nextFollowUpAt: null,
      latestOutcome: null,
      now,
    });
    assert.equal(view.statusLabel, "Sem contato realizado");
    assert.equal(view.actionLabel, "Fazer primeiro contato");
    assert.equal(view.followUpState, "none");
  });

  it("waits when SENT_NO_REPLY and follow-up is in the future", () => {
    const view = getNextAction({
      stage: "CONTACTED",
      nextFollowUpAt: new Date("2026-07-29T12:00:00.000Z"),
      latestOutcome: "SENT_NO_REPLY",
      now,
    });
    assert.equal(view.actionLabel, "Aguardar follow-up");
    assert.equal(view.followUpState, "scheduled");
  });

  it("asks for follow-up when SENT_NO_REPLY is overdue", () => {
    const view = getNextAction({
      stage: "CONTACTED",
      nextFollowUpAt: new Date("2026-07-20T12:00:00.000Z"),
      latestOutcome: "SENT_NO_REPLY",
      now,
    });
    assert.equal(view.actionLabel, "Enviar follow-up");
    assert.equal(view.followUpState, "overdue");
  });

  it("marks follow-up due today", () => {
    assert.equal(
      classifyFollowUp(new Date("2026-07-24T09:00:00.000Z"), now),
      "due_today",
    );
  });

  it("handles REPLIED and MEETING_SCHEDULED", () => {
    assert.equal(
      getNextAction({
        stage: "CONTACTED",
        nextFollowUpAt: null,
        latestOutcome: "REPLIED",
        now,
      }).actionLabel,
      "Continuar conversa",
    );
    assert.equal(
      getNextAction({
        stage: "MEETING",
        nextFollowUpAt: null,
        latestOutcome: "MEETING_SCHEDULED",
        now,
      }).actionLabel,
      "Preparar reunião",
    );
  });

  it("respects WON and LOST stages", () => {
    assert.equal(
      getNextAction({
        stage: "WON",
        nextFollowUpAt: null,
        latestOutcome: "INTERESTED",
        now,
      }).actionLabel,
      "Nenhuma ação comercial pendente",
    );
    assert.equal(
      getNextAction({
        stage: "LOST",
        nextFollowUpAt: null,
        latestOutcome: null,
        now,
      }).statusLabel,
      "Encerrado",
    );
  });

  it("picks latest non-stage-change outcome", () => {
    assert.equal(
      pickLatestOutcome([
        { type: "STAGE_CHANGE", outcome: null },
        { type: "WHATSAPP", outcome: "SENT_NO_REPLY" },
      ]),
      "SENT_NO_REPLY",
    );
  });
});
