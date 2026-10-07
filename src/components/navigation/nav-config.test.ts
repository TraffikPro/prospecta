import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MOBILE_PRIMARY_NAV,
  isNavPathActive,
  morePageSections,
  profileRoleLabel,
  visibleNavGroups,
  visibleNavItems,
} from "./nav-config";

const admin = { role: "ADMIN", canRunAcquisition: false };
const member = { role: "MEMBER", canRunAcquisition: false };
const memberAcquisition = { role: "MEMBER", canRunAcquisition: true };

describe("visibleNavItems", () => {
  it("shows the full commercial IA for ADMIN", () => {
    assert.deepEqual(
      visibleNavItems(admin).map((item) => item.id),
      [
        "overview",
        "my-leads",
        "intelligence",
        "pipeline",
        "leads",
        "portfolio",
        "acquisition",
        "high-pool",
        "team",
      ],
    );
  });

  it("hides gestão items from MEMBER without acquisition", () => {
    assert.deepEqual(
      visibleNavItems(member).map((item) => item.id),
      [
        "overview",
        "my-leads",
        "intelligence",
        "pipeline",
        "leads",
        "portfolio",
      ],
    );
  });

  it("shows acquisition to opted-in MEMBER without Equipe", () => {
    const items = visibleNavItems(memberAcquisition);
    assert.deepEqual(
      items.map((item) => item.id),
      [
        "overview",
        "my-leads",
        "intelligence",
        "pipeline",
        "leads",
        "portfolio",
        "acquisition",
      ],
    );
    assert.equal(
      items.find((item) => item.id === "acquisition")?.group,
      "commercial",
    );
  });
});

describe("visibleNavGroups", () => {
  it("keeps ADMIN acquisition under Gestão", () => {
    const groups = visibleNavGroups(admin);
    assert.deepEqual(
      groups.map((group) => group.label),
      [null, "Operação", "Base comercial", "Gestão"],
    );
    const management = groups.find((group) => group.id === "management");
    assert.deepEqual(
      management?.items.map((item) => item.label),
      ["Aquisição", "Revisão HIGH", "Equipe"],
    );
  });

  it("omits empty Gestão for MEMBER", () => {
    const groups = visibleNavGroups(member);
    assert.equal(
      groups.some((group) => group.id === "management"),
      false,
    );
  });
});

describe("morePageSections", () => {
  it("groups mobile overflow without duplicating bottom-nav items", () => {
    const sections = morePageSections(admin);
    assert.deepEqual(
      sections.map((section) => ({
        label: section.label,
        ids: section.items.map((item) => item.id),
      })),
      [
        { label: "Geral", ids: ["overview", "leads", "portfolio"] },
        { label: "Gestão", ids: ["acquisition", "high-pool", "team"] },
      ],
    );
  });
});

describe("isNavPathActive", () => {
  it("does not treat nested app routes as Visão geral", () => {
    assert.equal(isNavPathActive("/app", "/app", "exact"), true);
    assert.equal(isNavPathActive("/app/my-leads", "/app", "exact"), false);
    assert.equal(
      isNavPathActive("/app/leads/abc", "/app/leads", "prefix"),
      true,
    );
  });
});

describe("profileRoleLabel", () => {
  it("uses product language for software roles", () => {
    assert.equal(profileRoleLabel("ADMIN"), "Administrador");
    assert.equal(profileRoleLabel("MEMBER"), "Membro");
  });
});

describe("mobile primary nav icons", () => {
  it("exposes icon ids for bottom nav items", () => {
    assert.equal(MOBILE_PRIMARY_NAV[0]?.icon, "queue");
    assert.equal(MOBILE_PRIMARY_NAV[1]?.icon, "intelligence");
    assert.equal(MOBILE_PRIMARY_NAV[2]?.icon, "pipeline");
    assert.equal(MOBILE_PRIMARY_NAV[3]?.icon, "more");
  });
});
