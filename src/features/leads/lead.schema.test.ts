import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLeadInputSchema } from "./lead.schema";

describe("createLeadInputSchema", () => {
  it("accepts company with email", () => {
    const parsed = createLeadInputSchema.parse({
      companyName: "Acme Ltda",
      email: "contato@acme.example",
      ownerId: "user_1",
    });
    assert.equal(parsed.stage, "NEW");
    assert.equal(parsed.companyName, "Acme Ltda");
  });

  it("rejects lead without email and phone", () => {
    assert.throws(() =>
      createLeadInputSchema.parse({
        companyName: "Acme Ltda",
        ownerId: "user_1",
      }),
    );
  });
});
