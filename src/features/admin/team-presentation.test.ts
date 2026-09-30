import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatOpenOwnedLeads,
  formatTeamMemberCount,
} from "./team-presentation";

describe("team presentation", () => {
  it("formats open owned leads factually", () => {
    assert.equal(formatOpenOwnedLeads(0), "Nenhum lead aberto");
    assert.equal(formatOpenOwnedLeads(1), "1 lead aberto");
    assert.equal(formatOpenOwnedLeads(12), "12 leads abertos");
  });

  it("formats member count", () => {
    assert.equal(formatTeamMemberCount(1), "1 membro");
    assert.equal(formatTeamMemberCount(3), "3 membros");
  });
});
