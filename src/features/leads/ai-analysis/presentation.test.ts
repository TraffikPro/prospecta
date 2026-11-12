import assert from "node:assert/strict";
import { it } from "node:test";
import { analysisDate, analysisError, evidenceHref, isAnalysisBlocked } from "./presentation";

it("evidence links reject executable schemes and embedded credentials", () => {
  for (const input of ["javascript:alert(1)", "data:text/html,test", "file:///etc/passwd", "https://user:secret@example.test", "bad-url"]) {
    assert.equal(evidenceHref(input), null);
  }
  assert.equal(evidenceHref("https://example.test/evidence"), "https://example.test/evidence");
});
it("permission/session failures block new runs without exposing internal codes", () => {
  for (const code of ["FORBIDDEN", "UNAUTHENTICATED", "AI_ANALYSIS_DISABLED", "PROVIDER_NOT_CONFIGURED"] as const) {
    const response = { ok: false as const, code };
    assert.equal(isAnalysisBlocked(response), true);
    assert.ok(analysisError(response));
    assert.equal(analysisError(response)?.includes(code), false);
  }
  assert.equal(isAnalysisBlocked({ ok: false, code: "INTERNAL" }), false);
});
it("dates have a deterministic timezone and tolerate invalid input", () => {
  assert.match(analysisDate("2026-11-12T17:00:00Z"), /14:00/);
  assert.equal(analysisDate("invalid"), "Data não disponível");
});
