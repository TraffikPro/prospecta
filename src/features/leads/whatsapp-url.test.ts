import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toWhatsAppUrl } from "./whatsapp-url";

describe("toWhatsAppUrl", () => {
  it("builds wa.me for a valid Brazilian mobile number", () => {
    assert.equal(toWhatsAppUrl("(13) 99999-9999"), "https://wa.me/13999999999");
  });

  it("returns null without enough digits", () => {
    assert.equal(toWhatsAppUrl(null), null);
    assert.equal(toWhatsAppUrl("139999999"), null);
  });
});
