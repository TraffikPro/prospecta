import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recordWhatsAppConsentSchema } from "./consent.schema";

describe("recordWhatsAppConsentSchema", () => {
  const baseIn = {
    leadId: "lead_1",
    status: "OPTED_IN" as const,
    source: "PHONE_CALL" as const,
    purpose: "PRESENTATION" as const,
    evidenceAt: new Date().toISOString(),
    phoneE164: "+5513999999999",
  };

  it("accepts a complete OPTED_IN", () => {
    const parsed = recordWhatsAppConsentSchema.safeParse(baseIn);
    assert.equal(parsed.success, true);
  });

  it("rejects OPTED_IN without source, purpose, evidence, or E.164", () => {
    assert.equal(
      recordWhatsAppConsentSchema.safeParse({
        ...baseIn,
        source: undefined,
      }).success,
      false,
    );
    assert.equal(
      recordWhatsAppConsentSchema.safeParse({
        leadId: "lead_1",
        status: "OPTED_IN",
        source: "PHONE_CALL",
        evidenceAt: new Date().toISOString(),
        phoneE164: "+5513999999999",
      }).success,
      false,
    );
    assert.equal(
      recordWhatsAppConsentSchema.safeParse({
        ...baseIn,
        evidenceAt: "",
      }).success,
      false,
    );
    assert.equal(
      recordWhatsAppConsentSchema.safeParse({
        ...baseIn,
        phoneE164: "13999999999",
      }).success,
      false,
    );
  });

  it("rejects unreasonably future evidenceAt", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const parsed = recordWhatsAppConsentSchema.safeParse({
      ...baseIn,
      evidenceAt: future,
    });
    assert.equal(parsed.success, false);
  });

  it("requires purposeNote when purpose is OTHER", () => {
    assert.equal(
      recordWhatsAppConsentSchema.safeParse({
        ...baseIn,
        purpose: "OTHER",
      }).success,
      false,
    );
    assert.equal(
      recordWhatsAppConsentSchema.safeParse({
        ...baseIn,
        purpose: "OTHER",
        purposeNote: "Pedido verbal na recepção",
      }).success,
      true,
    );
  });
});
