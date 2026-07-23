import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createLeadFormSchema,
  ingestExternalLeadSchema,
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

describe("ingestExternalLeadSchema", () => {
  it("requires externalId for GOOGLE_PLACES", () => {
    const result = ingestExternalLeadSchema.safeParse({
      companyName: "Clínica",
      phone: "13999999999",
      source: "GOOGLE_PLACES",
    });
    assert.equal(result.success, false);
  });

  it("accepts qualified Places payload", () => {
    const parsed = ingestExternalLeadSchema.parse({
      companyName: "Clínica",
      phone: "13999999999",
      source: "GOOGLE_PLACES",
      externalId: "ChIJxxx",
      intelligence: {
        score: 90,
        signals: ["NO_WEBSITE"],
        pitch: "Abordar com presença digital",
      },
    });
    assert.equal(parsed.externalId, "ChIJxxx");
    assert.equal(parsed.intelligence?.score, 90);
  });
});
