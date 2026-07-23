import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLeadFormSchema } from "./lead.schema";

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
