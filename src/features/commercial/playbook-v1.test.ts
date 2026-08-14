import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONTACT_NAME_FALLBACK,
  PLAYBOOK_NO_TEMPLATE,
  PLAYBOOK_QUICK_REPLIES,
  PLAYBOOK_SIGNAL_LABELS,
  PLAYBOOK_TEMPLATES,
  PLAYBOOK_UNAVAILABLE,
  assertsNoSiteQualityAttack,
  hasPlaybookPhone,
  interpolatePlaybookMessage,
  isPlaybookIcp,
  isSantosOdontologiaCampaign,
  resolveCommercialTemplate,
  resolveD0Kind,
} from "./playbook-v1";
import { buildCommercialPlaybookView } from "./playbook-view";
import type { LeadIntelligence } from "@/features/leads/intelligence/types";

const ICP_CAMPAIGN = "santos-odontologia-2026-07";

function intelligence(
  overrides: Partial<LeadIntelligence> = {},
): LeadIntelligence {
  return {
    score: 90,
    qualification: "HIGH",
    campaign: ICP_CAMPAIGN,
    signals: ["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"],
    rating: 4.8,
    reviews: 186,
    ...overrides,
  };
}

function snapshot(
  overrides: Partial<{
    companyName: string;
    contactName: string | null;
    phone: string | null;
    website: string | null;
    intelligence: LeadIntelligence | null;
  }> = {},
) {
  return {
    companyName: "Clínica Sorriso Santos",
    contactName: "Marina",
    phone: "13999999999",
    website: null,
    intelligence: intelligence(),
    ...overrides,
  };
}

describe("playbook ICP gating", () => {
  it("is available for Odontologia + Santos + HIGH + phone", () => {
    assert.equal(
      isPlaybookIcp({
        qualification: "HIGH",
        campaign: ICP_CAMPAIGN,
        phone: "13999999999",
      }),
      true,
    );
    const view = buildCommercialPlaybookView(snapshot());
    assert.equal(view.status, "available");
  });

  it("is unavailable for LOW", () => {
    const view = buildCommercialPlaybookView(
      snapshot({
        intelligence: intelligence({ qualification: "LOW", score: 20 }),
      }),
    );
    assert.deepEqual(view, {
      status: "unavailable",
      message: PLAYBOOK_UNAVAILABLE,
    });
  });

  it("is unavailable for MEDIUM", () => {
    const view = buildCommercialPlaybookView(
      snapshot({
        intelligence: intelligence({ qualification: "MEDIUM", score: 55 }),
      }),
    );
    assert.equal(view.status, "unavailable");
  });

  it("is unavailable for another niche", () => {
    assert.equal(
      isSantosOdontologiaCampaign("santos-restaurante-2026-07"),
      false,
    );
    const view = buildCommercialPlaybookView(
      snapshot({
        intelligence: intelligence({ campaign: "santos-restaurante-2026-07" }),
      }),
    );
    assert.equal(view.status, "unavailable");
  });

  it("is unavailable for another city", () => {
    assert.equal(
      isSantosOdontologiaCampaign("guaruja-odontologia-2026-07"),
      false,
    );
    const view = buildCommercialPlaybookView(
      snapshot({
        intelligence: intelligence({
          campaign: "guaruja-odontologia-2026-07",
        }),
      }),
    );
    assert.equal(view.status, "unavailable");
  });

  it("is unavailable without a WhatsApp-capable phone", () => {
    assert.equal(hasPlaybookPhone(null), false);
    assert.equal(hasPlaybookPhone("139999999"), false);
    const view = buildCommercialPlaybookView(snapshot({ phone: null }));
    assert.deepEqual(view, {
      status: "unavailable",
      message: PLAYBOOK_UNAVAILABLE,
    });
  });
});

describe("playbook signals and D0 templates", () => {
  it("labels NO_WEBSITE, HIGH_RATING and HIGH_REVIEWS in operator language", () => {
    assert.equal(PLAYBOOK_SIGNAL_LABELS.NO_WEBSITE, "Sem site informado");
    assert.equal(PLAYBOOK_SIGNAL_LABELS.HIGH_RATING, "Boa avaliação");
    assert.equal(
      PLAYBOOK_SIGNAL_LABELS.HIGH_REVIEWS,
      "Alto volume de avaliações",
    );

    const view = buildCommercialPlaybookView(snapshot());
    assert.equal(view.status, "available");
    if (view.status !== "available") {
      return;
    }
    assert.deepEqual(
      view.reasons.map((item) => item.label),
      ["Sem site informado", "Boa avaliação", "Alto volume de avaliações"],
    );
    assert.equal(
      view.reasons.find((item) => item.code === "NO_WEBSITE")?.text,
      "A empresa não possui site informado na ficha.",
    );
    assert.match(
      view.reasons.find((item) => item.code === "HIGH_RATING")?.text ?? "",
      /4,8/,
    );
    assert.match(
      view.reasons.find((item) => item.code === "HIGH_REVIEWS")?.text ?? "",
      /186/,
    );
  });

  it("resolves documented D0 combinations", () => {
    assert.equal(
      resolveD0Kind(["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"], false),
      "A",
    );
    assert.equal(resolveD0Kind(["NO_WEBSITE", "HIGH_RATING"], false), "A");
    assert.equal(resolveD0Kind(["NO_WEBSITE", "HIGH_REVIEWS"], false), "A");
    assert.equal(resolveD0Kind(["NO_WEBSITE"], false), "B");
    assert.equal(resolveD0Kind(["HIGH_RATING", "HIGH_REVIEWS"], false), "C");
    assert.equal(resolveD0Kind(["HIGH_RATING"], true), null);
    assert.equal(
      resolveCommercialTemplate({
        signals: ["NO_WEBSITE", "HIGH_RATING"],
        step: "D0",
        hasWebsite: false,
      })?.id,
      PLAYBOOK_TEMPLATES.d0A.id,
    );
    assert.equal(
      resolveCommercialTemplate({
        signals: ["NO_WEBSITE"],
        step: "D0",
        hasWebsite: false,
      })?.id,
      PLAYBOOK_TEMPLATES.d0B.id,
    );
    assert.equal(
      resolveCommercialTemplate({
        signals: ["HIGH_RATING", "HIGH_REVIEWS"],
        step: "D0",
        hasWebsite: true,
      })?.id,
      PLAYBOOK_TEMPLATES.d0C.id,
    );
  });

  it("does not attack site quality when a website is on file", () => {
    const view = buildCommercialPlaybookView(
      snapshot({
        website: "https://clinica.example",
        intelligence: intelligence({
          signals: ["NO_WEBSITE", "HIGH_RATING", "HIGH_REVIEWS"],
        }),
      }),
    );
    assert.equal(view.status, "available");
    if (view.status !== "available") {
      return;
    }
    const d0 = view.steps.find((item) => item.step === "D0");
    assert.equal(d0?.found, true);
    assert.equal(d0?.text, interpolatePlaybookMessage(PLAYBOOK_TEMPLATES.d0C.message, {
      contactName: "Marina",
      companyName: "Clínica Sorriso Santos",
    }));
    assert.equal(assertsNoSiteQualityAttack(d0?.text ?? ""), true);
    assert.equal(
      view.reasons.some((item) => item.code === "NO_WEBSITE"),
      false,
    );
    assert.doesNotMatch(d0?.text ?? "", /desatualizado|pode melhorar|está ruim/i);
  });
});

describe("playbook cadence templates", () => {
  it("returns approved copy for D0, D+2, D+5 and D+9", () => {
    const view = buildCommercialPlaybookView(snapshot());
    assert.equal(view.status, "available");
    if (view.status !== "available") {
      return;
    }
    const byStep = Object.fromEntries(
      view.steps.map((item) => [item.step, item]),
    );
    assert.equal(byStep.D0?.found, true);
    assert.match(byStep.D0?.text ?? "", /não encontrei um site claro da clínica/);
    assert.equal(byStep.D2?.found, true);
    assert.match(byStep.D2?.text ?? "", /10 min/);
    assert.equal(byStep.D5?.found, true);
    assert.match(byStep.D5?.text ?? "", /site-conceito de odontologia/);
    assert.equal(byStep.D9?.found, true);
    assert.match(byStep.D9?.text ?? "", /Não vou insistir/);
  });

  it("does not invent a reactivation script", () => {
    assert.equal(
      resolveCommercialTemplate({
        signals: ["NO_WEBSITE"],
        step: "REACTIVATION",
        hasWebsite: false,
      }),
      null,
    );
    const view = buildCommercialPlaybookView(snapshot());
    assert.equal(view.status, "available");
    if (view.status !== "available") {
      return;
    }
    const reactivation = view.steps.find((item) => item.step === "REACTIVATION");
    assert.equal(reactivation?.found, false);
    assert.equal(reactivation?.text, PLAYBOOK_NO_TEMPLATE);
  });

  it("resolver is a pure lookup — no mutation payload", () => {
    const first = resolveCommercialTemplate({
      signals: ["NO_WEBSITE"],
      step: "D2",
      hasWebsite: false,
    });
    const second = resolveCommercialTemplate({
      signals: ["NO_WEBSITE"],
      step: "D5",
      hasWebsite: false,
    });
    assert.equal(first?.step, "D2");
    assert.equal(second?.step, "D5");
    assert.notEqual(first?.message, second?.message);
  });
});

describe("playbook interpolation", () => {
  it("interpolates company and city and never leaks undefined", () => {
    const text = interpolatePlaybookMessage(PLAYBOOK_TEMPLATES.d0A.message, {
      contactName: "Marina",
      companyName: "Clínica Sorriso Santos",
      city: "Santos",
    });
    assert.match(text, /Oi, Marina/);
    assert.match(text, /Clínica Sorriso Santos/);
    assert.match(text, /em Santos/);
    assert.doesNotMatch(text, /undefined|null|\{\{/);
  });

  it("uses the approved greeting fallback when contact name is missing", () => {
    const d0 = interpolatePlaybookMessage(PLAYBOOK_TEMPLATES.d0B.message, {
      contactName: null,
      companyName: "Clínica Sorriso Santos",
    });
    assert.ok(d0.startsWith(CONTACT_NAME_FALLBACK));
    assert.doesNotMatch(d0, /Oi, \.|undefined/);

    const d5 = interpolatePlaybookMessage(PLAYBOOK_TEMPLATES.d5.message, {
      contactName: "  ",
      companyName: "Clínica Sorriso Santos",
    });
    assert.ok(d5.startsWith(`${CONTACT_NAME_FALLBACK} Último`));
    assert.doesNotMatch(d5, /undefined|\{\{contactName\}\}/);

    const view = buildCommercialPlaybookView(snapshot({ contactName: null }));
    assert.equal(view.status, "available");
    if (view.status !== "available") {
      return;
    }
    const viewD0 = view.steps.find((item) => item.step === "D0");
    assert.ok(viewD0?.text.startsWith(CONTACT_NAME_FALLBACK));
    assert.doesNotMatch(viewD0?.text ?? "", /undefined|Oi, \./);
  });
});

describe("playbook quick replies", () => {
  it("exposes only quoted approved replies", () => {
    assert.deepEqual(
      PLAYBOOK_QUICK_REPLIES.map((item) => item.label),
      ["Quanto custa?", "Já tenho fornecedor", "Agora não"],
    );
    const view = buildCommercialPlaybookView(snapshot());
    assert.equal(view.status, "available");
    if (view.status !== "available") {
      return;
    }
    assert.equal(view.replies.length, 3);
    assert.equal(
      view.replies.every((item) =>
        PLAYBOOK_QUICK_REPLIES.some((approved) => approved.text === item.text),
      ),
      true,
    );
  });
});
