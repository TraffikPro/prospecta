import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPhoneDigitCountValid,
  normalizeCompanyName,
  normalizeEmail,
  normalizePhone,
} from "./lead.normalize";

describe("lead normalize", () => {
  it("normalizes company name", () => {
    assert.equal(normalizeCompanyName("  Empresa   XPTO "), "Empresa XPTO");
  });

  it("normalizes email", () => {
    assert.equal(normalizeEmail(" Contato@Empresa.com "), "contato@empresa.com");
  });

  it("normalizes phone to digits", () => {
    assert.equal(normalizePhone("(13) 99999-9999"), "13999999999");
  });

  it("validates phone digit count", () => {
    assert.equal(isPhoneDigitCountValid("1399999999"), true);
    assert.equal(isPhoneDigitCountValid("139999999"), false);
  });
});
