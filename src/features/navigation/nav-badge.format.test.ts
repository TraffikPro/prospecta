import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  badgeCountForNavItem,
  formatBadgeCount,
  navItemAccessibleName,
} from "./nav-badge.format";

describe("formatBadgeCount", () => {
  it("hides zero and caps large counts without changing the raw value", () => {
    assert.equal(formatBadgeCount(0), "");
    assert.equal(formatBadgeCount(1), "1");
    assert.equal(formatBadgeCount(3), "3");
    assert.equal(formatBadgeCount(99), "99");
    assert.equal(formatBadgeCount(105), "99+");
  });
});

describe("navItemAccessibleName", () => {
  it("announces the real pending count, including values above the visual cap", () => {
    assert.equal(navItemAccessibleName("Minha fila", "my-leads", 0), "Minha fila");
    assert.equal(
      navItemAccessibleName("Minha fila", "my-leads", 1),
      "Minha fila, 1 pendência",
    );
    assert.equal(
      navItemAccessibleName("Minha fila", "my-leads", 3),
      "Minha fila, 3 pendências",
    );
    assert.equal(
      navItemAccessibleName("Minha fila", "my-leads", 143),
      "Minha fila, 143 pendências",
    );
    assert.equal(
      navItemAccessibleName("Revisão HIGH", "high-pool", 2),
      "Revisão HIGH, 2 recicláveis",
    );
  });
});

describe("badgeCountForNavItem", () => {
  it("does not invent counts for items without an action badge", () => {
    const badges = { myQueue: 4, highReview: 2 };
    assert.equal(badgeCountForNavItem("my-leads", badges), 4);
    assert.equal(badgeCountForNavItem("high-pool", badges), 2);
    assert.equal(badgeCountForNavItem("pipeline", badges), 0);
    assert.equal(badgeCountForNavItem("overview", badges), 0);
    assert.equal(badgeCountForNavItem("high-pool", { myQueue: 4 }), 0);
  });
});
