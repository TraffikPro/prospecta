import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createActivityFormSchema } from "./activity.schema";
import { shouldRequireNextFollowUp } from "./activity.rules";

describe("createActivityFormSchema", () => {
  it("accepts valid WhatsApp with follow-up", () => {
    const parsed = createActivityFormSchema.parse({
      leadId: "lead_1",
      type: "WHATSAPP",
      outcome: "INTERESTED",
      body: "Falou com o financeiro",
      nextFollowUpAt: "2026-07-25T14:00",
    });
    assert.equal(parsed.type, "WHATSAPP");
  });

  it("rejects WhatsApp without outcome", () => {
    const result = createActivityFormSchema.safeParse({
      leadId: "lead_1",
      type: "WHATSAPP",
      body: "Tentativa de contato",
    });
    assert.equal(result.success, false);
  });

  it("rejects INTERESTED without nextFollowUpAt", () => {
    const result = createActivityFormSchema.safeParse({
      leadId: "lead_1",
      type: "WHATSAPP",
      outcome: "INTERESTED",
      body: "Interessado",
    });
    assert.equal(result.success, false);
  });

  it("allows NOTE without outcome or follow-up", () => {
    const parsed = createActivityFormSchema.parse({
      leadId: "lead_1",
      type: "NOTE",
      body: "Lembrete interno",
    });
    assert.equal(parsed.type, "NOTE");
  });

  it("allows NOT_INTERESTED without follow-up", () => {
    const parsed = createActivityFormSchema.parse({
      leadId: "lead_1",
      type: "EMAIL",
      outcome: "NOT_INTERESTED",
      body: "Sem interesse",
    });
    assert.equal(parsed.outcome, "NOT_INTERESTED");
  });
});

describe("shouldRequireNextFollowUp", () => {
  it("requires follow-up for continuity outcomes", () => {
    assert.equal(
      shouldRequireNextFollowUp({ type: "WHATSAPP", outcome: "SENT_NO_REPLY" }),
      true,
    );
    assert.equal(
      shouldRequireNextFollowUp({
        type: "EMAIL",
        outcome: "MEETING_SCHEDULED",
      }),
      true,
    );
  });

  it("does not require follow-up for terminal-ish outcomes", () => {
    assert.equal(
      shouldRequireNextFollowUp({
        type: "WHATSAPP",
        outcome: "NOT_INTERESTED",
      }),
      false,
    );
    assert.equal(
      shouldRequireNextFollowUp({ type: "EMAIL", outcome: "WRONG_CONTACT" }),
      false,
    );
  });

  it("treats REPLIED as optional", () => {
    assert.equal(
      shouldRequireNextFollowUp({ type: "WHATSAPP", outcome: "REPLIED" }),
      false,
    );
  });
});
