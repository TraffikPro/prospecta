import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatWeekRangePtBr,
  getOperationalWeek,
} from "@/features/portfolio/week";

import { formatPercent } from "./dashboard.format";
import {
  buildDashboardView,
  type DashboardKpiSnapshot,
} from "./dashboard.view";

const WEEK = getOperationalWeek(new Date("2026-08-12T18:00:00.000Z"));

function snapshot(
  overrides: Partial<DashboardKpiSnapshot> = {},
): DashboardKpiSnapshot {
  return {
    period: {
      weekStartAt: WEEK.weekStartAt,
      weekEndAt: WEEK.weekEndAt,
    },
    quotaConfigured: true,
    target: 5,
    assigned: 4,
    treated: 3,
    pending: 1,
    treatmentRate: 0.75,
    portfolioFillRate: 0.8,
    treatmentTargetRate: 0.6,
    bySource: {
      newAcquisition: 2,
      recycled: 1,
      adminReassigned: 1,
      other: 1,
    },
    released: { weekClosed: 0 },
    ...overrides,
  };
}

function card(
  view: ReturnType<typeof buildDashboardView>,
  id: "target" | "assigned" | "treated" | "pending",
) {
  const found = view.cards.find((item) => item.id === id);
  assert.ok(found);
  return found;
}

describe("buildDashboardView — operator", () => {
  it("renders canonical counts and formats rates without recomputing them", () => {
    const view = buildDashboardView(
      "operator",
      snapshot({
        treated: 3,
        assigned: 10,
        treatmentRate: 0.5,
        portfolioFillRate: 0.99,
        treatmentTargetRate: 0.11,
      }),
    );

    assert.equal(card(view, "assigned").value, "10");
    assert.equal(card(view, "treated").value, "3");
    assert.equal(card(view, "pending").value, "1");
    assert.equal(card(view, "target").value, "5");
    assert.equal(
      card(view, "treated").hint,
      `${formatPercent(0.5)} dos atribuídos`,
    );
    assert.equal(
      card(view, "assigned").hint,
      `${formatPercent(0.99)} da meta`,
    );
    assert.notEqual(card(view, "treated").hint, "30% dos atribuídos");

    const treatment = view.progress.find((item) => item.id === "treatment");
    assert.equal(treatment?.rate, 0.5);
    assert.equal(treatment?.formatted, formatPercent(0.5));
  });

  it("points the primary CTA at Minha fila and treats pending as the action", () => {
    const withPending = buildDashboardView("operator", snapshot({ pending: 2 }));
    assert.equal(withPending.primaryCta.href, "/app/my-leads");
    assert.equal(withPending.primaryCta.label, "Tratar pendências");
    assert.equal(card(withPending, "pending").emphasized, true);
    assert.equal(card(withPending, "pending").hint, "Exigem ação");

    const clear = buildDashboardView(
      "operator",
      snapshot({ assigned: 4, pending: 0, treated: 4, treatmentRate: 1 }),
    );
    assert.equal(clear.primaryCta.label, "Ver minha fila");
    assert.equal(clear.primaryCta.href, "/app/my-leads");
  });

  it("does not present an unconfigured quota as meta 0", () => {
    const view = buildDashboardView(
      "operator",
      snapshot({
        quotaConfigured: false,
        target: 0,
        assigned: 0,
        treated: 0,
        pending: 0,
        treatmentRate: 0,
        portfolioFillRate: 0,
        treatmentTargetRate: 0,
      }),
    );
    assert.equal(card(view, "target").value, "Não configurada");
    assert.notEqual(card(view, "target").value, "0");
    assert.match(card(view, "target").hint, /não configurada/i);
    assert.equal(view.empty?.kind, "no_quota_no_assignments");
    assert.equal(
      view.progress.some((item) => item.id === "treatmentTarget"),
      false,
    );
  });

  it("shows the empty-wallet copy when quota exists and assigned is 0", () => {
    const view = buildDashboardView(
      "operator",
      snapshot({
        assigned: 0,
        treated: 0,
        pending: 0,
        treatmentRate: 0,
        portfolioFillRate: 0,
        treatmentTargetRate: 0,
      }),
    );
    assert.equal(view.empty?.kind, "quota_empty_wallet");
    assert.equal(view.empty?.description, "Meta: 5 leads.");
    assert.equal(view.primaryCta.label, "Ir para Minha fila");
    assert.equal(view.primaryCta.href, "/app/my-leads");
  });

  it("shows a quiet all-treated note when assigned > 0 and pending = 0", () => {
    const view = buildDashboardView(
      "operator",
      snapshot({
        assigned: 4,
        treated: 4,
        pending: 0,
        treatmentRate: 1,
      }),
    );
    assert.equal(view.empty?.kind, "all_treated");
    assert.equal(view.empty?.title, "Tudo tratado por enquanto.");
  });

  it("labels assignment sources in Portuguese without inferring history", () => {
    const view = buildDashboardView("operator", snapshot());
    const byId = Object.fromEntries(
      view.sources.map((row) => [row.id, row]),
    );
    assert.equal(byId.newAcquisition?.label, "Nova aquisição");
    assert.equal(byId.newAcquisition?.count, 2);
    assert.equal(byId.recycled?.label, "Reciclados");
    assert.equal(byId.recycled?.count, 1);
    assert.equal(byId.adminReassigned?.label, "Reatribuições");
    assert.equal(byId.adminReassigned?.count, 1);
    assert.equal(byId.other?.label, "Manuais");
    assert.equal(byId.other?.count, 1);
    assert.equal(view.sources.length, 4);
  });

  it("shows WEEK_CLOSED only as discrete history when the count is above zero", () => {
    const hidden = buildDashboardView("operator", snapshot());
    assert.equal(hidden.weekClosedCount, null);

    const shown = buildDashboardView(
      "operator",
      snapshot({ released: { weekClosed: 2 } }),
    );
    assert.equal(shown.weekClosedCount, 2);
  });
});

describe("buildDashboardView — team", () => {
  it("uses the aggregated snapshot and management CTAs, not an operator ranking", () => {
    const view = buildDashboardView(
      "team",
      snapshot({
        operatorsTotal: 6,
        operatorsWithQuota: 4,
        treatmentRate: 0.4,
        assigned: 10,
        treated: 4,
        pending: 3,
      }),
    );

    assert.equal(view.kind, "team");
    assert.equal(view.operatorsLine, "Operadores com meta: 4 de 6");
    assert.equal(view.primaryCta.href, "/admin/users");
    assert.equal(view.primaryCta.label, "Ver equipe");
    assert.equal(view.secondaryCtas[0]?.href, "/admin/high-pool");
    assert.equal(card(view, "pending").value, "3");
    assert.equal(
      view.progress.find((item) => item.id === "treatment")?.formatted,
      formatPercent(0.4),
    );
    assert.equal(
      view.sources.find((row) => row.id === "other")?.label,
      "Outros",
    );
  });

  it("does not invent an operators line when the contract omits it", () => {
    const view = buildDashboardView("team", snapshot());
    assert.equal(view.operatorsLine, null);
  });
});

describe("buildDashboardView — timezone label", () => {
  it("labels the week with America/Sao_Paulo via the operational helper", () => {
    const view = buildDashboardView("operator", snapshot());
    assert.equal(view.weekLabel, formatWeekRangePtBr(WEEK));
    assert.match(view.weekLabel, /10/);
    assert.match(view.weekLabel, /16/);
  });

  it("does not keep Sunday's week after Monday 00:00 SP", () => {
    const sunday = getOperationalWeek(new Date("2026-08-17T02:59:59.999Z"));
    const monday = getOperationalWeek(new Date("2026-08-17T03:00:00.000Z"));
    const sundayView = buildDashboardView(
      "operator",
      snapshot({
        period: {
          weekStartAt: sunday.weekStartAt,
          weekEndAt: sunday.weekEndAt,
        },
      }),
    );
    const mondayView = buildDashboardView(
      "operator",
      snapshot({
        period: {
          weekStartAt: monday.weekStartAt,
          weekEndAt: monday.weekEndAt,
        },
      }),
    );
    assert.notEqual(sundayView.weekLabel, mondayView.weekLabel);
    assert.equal(sundayView.weekLabel, formatWeekRangePtBr(sunday));
    assert.equal(mondayView.weekLabel, formatWeekRangePtBr(monday));
  });
});
