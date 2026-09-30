import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FORGOT_SUBTITLE,
  FORGOT_TITLE,
  LOGIN_BRAND_CONTEXT,
  LOGIN_SUBTITLE,
  LOGIN_TITLE,
  PUBLIC_BRAND_CONTEXT,
  RESET_SUBTITLE,
  RESET_TITLE,
} from "./auth-entry-copy";

const BANNED_FRAGMENTS = [
  "transforme",
  "potencialize",
  "revolucione",
  "inteligência para",
  "bem-vindo de volta",
];

describe("auth-entry-copy", () => {
  const all = [
    LOGIN_TITLE,
    LOGIN_SUBTITLE,
    LOGIN_BRAND_CONTEXT,
    FORGOT_TITLE,
    FORGOT_SUBTITLE,
    PUBLIC_BRAND_CONTEXT,
    RESET_TITLE,
    RESET_SUBTITLE,
  ]
    .join(" ")
    .toLowerCase();

  it("keeps login title task-first", () => {
    assert.equal(LOGIN_TITLE, "Entrar");
    assert.match(LOGIN_SUBTITLE.toLowerCase(), /opera/);
  });

  it("avoids generic AI-SaaS marketing fragments", () => {
    for (const fragment of BANNED_FRAGMENTS) {
      assert.equal(
        all.includes(fragment),
        false,
        `unexpected fragment: ${fragment}`,
      );
    }
  });
});
