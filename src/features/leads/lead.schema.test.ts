import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createLeadFormSchema,
  moveLeadStageFormSchema,
} from "./lead.schema";
import {
  buildStageChangeBody,
  formatStageChangeSummary,
  parseStageChangeBody,
} from "./stage-change";

describe("createLeadFormSchema", () => {
  it("accepts valid lead with email", () => {
    const parsed = createLeadFormSchema.parse({
      companyName: "Acme Ltda",
      email: "contato@acme.example",
    });
    assert.equal(parsed.companyName, "Acme Ltda");
  });

  it("rejects empty company", () => {
    assert.throws(() =>
      createLeadFormSchema.parse({
        companyName: "   ",
        email: "contato@acme.example",
      }),
    );
  });

  it("rejects lead without email and phone", () => {
    const result = createLeadFormSchema.safeParse({
      companyName: "Acme Ltda",
    });
    assert.equal(result.success, false);
  });

  it("rejects short phone", () => {
    const result = createLeadFormSchema.safeParse({
      companyName: "Acme Ltda",
      phone: "12345",
    });
    assert.equal(result.success, false);
  });
});

describe("moveLeadStageFormSchema", () => {
  it("rejects LOST without reason", () => {
    const result = moveLeadStageFormSchema.safeParse({
      leadId: "lead_1",
      stage: "LOST",
    });
    assert.equal(result.success, false);
  });

  it("accepts LOST with reason", () => {
    const parsed = moveLeadStageFormSchema.parse({
      leadId: "lead_1",
      stage: "LOST",
      lostReason: "Sem orçamento",
    });
    assert.equal(parsed.lostReason, "Sem orçamento");
  });

  it("rejects invalid stage", () => {
    const result = moveLeadStageFormSchema.safeParse({
      leadId: "lead_1",
      stage: "INVALID",
    });
    assert.equal(result.success, false);
  });
});

describe("stage-change payload", () => {
  it("builds and parses structured body", () => {
    const body = buildStageChangeBody("CONTACTED", "MEETING");
    assert.deepEqual(parseStageChangeBody(body), {
      from: "CONTACTED",
      to: "MEETING",
    });
    assert.equal(
      formatStageChangeSummary(body),
      "Contatado → Reunião",
    );
  });
});
