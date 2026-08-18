import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidPhoneE164, suggestPhoneE164 } from "./phone-e164";

describe("phone E.164", () => {
  it("accepts a valid Brazilian mobile E.164", () => {
    assert.equal(isValidPhoneE164("+5513999999999"), true);
  });

  it("rejects digits without plus", () => {
    assert.equal(isValidPhoneE164("5513999999999"), false);
  });

  it("suggests +55 from 11-digit legacy phone without treating it as consent", () => {
    assert.equal(suggestPhoneE164("13999999999"), "+5513999999999");
    assert.equal(suggestPhoneE164("(13) 99999-9999"), "+5513999999999");
  });

  it("does not invent E.164 from short junk", () => {
    assert.equal(suggestPhoneE164("123"), null);
  });
});
