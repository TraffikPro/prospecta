import { isPhoneDigitCountValid } from "@/features/leads/lead.normalize";
import type { CanonicalSignal } from "@/features/leads/intelligence/signal-catalog";
import { isCanonicalSignal } from "@/features/leads/intelligence/signal-catalog";

export type CommercialSignal = CanonicalSignal;

export type CadenceStep = "D0" | "D2" | "D5" | "D9" | "REACTIVATION";

export type CommercialTemplate = {
  id: string;
  signals: CommercialSignal[];
  step: CadenceStep;
  message: string;
};

export type D0Kind = "A" | "B" | "C";

export const PLAYBOOK_UNAVAILABLE =
  "Playbook comercial indisponível para este lead.";

export const PLAYBOOK_NO_TEMPLATE =
  "Ainda não há abordagem aprovada para este contexto.";

export const PLAYBOOK_CITY = "Santos";

export const CONTACT_NAME_FALLBACK = "Olá!";

export const CADENCE_STEPS: readonly {
  value: CadenceStep;
  label: string;
}[] = [
  { value: "D0", label: "D0" },
  { value: "D2", label: "D+2" },
  { value: "D5", label: "D+5" },
  { value: "D9", label: "D+9" },
  { value: "REACTIVATION", label: "Reativação" },
] as const;

/** Operator-facing chips — not the Intelligence Card catalog labels. */
export const PLAYBOOK_SIGNAL_LABELS: Record<CommercialSignal, string> = {
  NO_WEBSITE: "Sem site informado",
  HIGH_RATING: "Boa avaliação",
  HIGH_REVIEWS: "Alto volume de avaliações",
};

/**
 * Approved WhatsApp copy from docs/commercial/playbook-v1.md §04.
 * Placeholders: {{contactName}} {{companyName}} {{city}}
 */
export const PLAYBOOK_TEMPLATES = {
  d0A: {
    id: "d0-no-website-reputation",
    signals: ["NO_WEBSITE"] as CommercialSignal[],
    step: "D0" as const,
    message:
      "Oi, {{contactName}}. Vi a {{companyName}} no Google em {{city}} — nota e avaliações boas, mas não encontrei um site claro da clínica. Hoje o paciente que pesquisa vocês consegue entender os tratamentos e chamar no WhatsApp sem ficar só no perfil do Maps?",
  },
  d0B: {
    id: "d0-no-website",
    signals: ["NO_WEBSITE"] as CommercialSignal[],
    step: "D0" as const,
    message:
      "Oi, {{contactName}}. Encontrei a {{companyName}} e não identifiquei um site próprio. Quando alguém pesquisa o nome de vocês, o próximo passo fica no Google/WhatsApp mesmo, ou vocês já têm alguma página de referência?",
  },
  d0C: {
    id: "d0-rating-reviews-with-site",
    signals: ["HIGH_RATING", "HIGH_REVIEWS"] as CommercialSignal[],
    step: "D0" as const,
    message:
      "Oi, {{contactName}}. Vi que a {{companyName}} tem bastante avaliação no Google. Queria entender: hoje a maior parte dos pacientes novos chega pelo Maps, indicação ou algum site/página de vocês?",
  },
  d2: {
    id: "d2-follow-up",
    signals: [] as CommercialSignal[],
    step: "D2" as const,
    message:
      "Oi, {{contactName}}. Só para não perder o contexto: a dúvida era se o paciente que acha a {{companyName}} no Google tem um próximo passo claro além do perfil. Faz sentido conversar 10 min sobre isso ou agora não é o momento?",
  },
  d5: {
    id: "d5-follow-up",
    signals: [] as CommercialSignal[],
    step: "D5" as const,
    message:
      "{{contactName}}, último recado desta semana: se a agenda de novos pacientes já está resolvida, eu encerro por aqui. Se quiser, te mostro em 15 min um site-conceito de odontologia (modelo, não case) só para comparar o próximo passo depois do Google.",
  },
  d9: {
    id: "d9-close-cycle",
    signals: [] as CommercialSignal[],
    step: "D9" as const,
    message:
      "Oi, {{contactName}}. Não vou insistir. Se no futuro quiserem olhar presença digital da {{companyName}} com calma, fico à disposição. Bom atendimento aí.",
  },
} as const satisfies Record<string, CommercialTemplate>;

/** Quoted replies from playbook-v1.md §04 — sendable text only, no invented copy. */
export const PLAYBOOK_QUICK_REPLIES = [
  {
    id: "ask-price",
    label: "Quanto custa?",
    text: "Depende do que a clínica precisa; em 15 min eu te mostro o recorte e a faixa.",
  },
  {
    id: "has-vendor",
    label: "Já tenho fornecedor",
    text: "Perfeito. Vocês estão satisfeitos com o próximo passo do paciente depois do Google, ou é mais inércia?",
  },
  {
    id: "not-now",
    label: "Agora não",
    text: "Melhor em qual mês?",
  },
] as const;

const SITE_QUALITY_ATTACK =
  /site está desatualizado|site pode melhorar|site está ruim|site de vocês está ultrapassado/i;

export function isSantosOdontologiaCampaign(
  campaign: string | null | undefined,
): boolean {
  if (!campaign) {
    return false;
  }
  const slug = campaign.trim().toLowerCase();
  return slug.includes("santos") && slug.includes("odontolog");
}

export function hasPlaybookPhone(phone: string | null | undefined): boolean {
  if (!phone) {
    return false;
  }
  return isPhoneDigitCountValid(phone.replace(/\D/g, ""));
}

export function hasInformedWebsite(website: string | null | undefined): boolean {
  return Boolean(website && website.trim() !== "");
}

export function isPlaybookIcp(input: {
  qualification: string | null | undefined;
  campaign: string | null | undefined;
  phone: string | null | undefined;
}): boolean {
  return (
    input.qualification === "HIGH" &&
    isSantosOdontologiaCampaign(input.campaign) &&
    hasPlaybookPhone(input.phone)
  );
}

export function playbookSignalsOf(
  signals: readonly string[],
): CommercialSignal[] {
  const seen = new Set<CommercialSignal>();
  const result: CommercialSignal[] = [];
  for (const raw of signals) {
    if (!isCanonicalSignal(raw) || seen.has(raw)) {
      continue;
    }
    seen.add(raw);
    result.push(raw);
  }
  return result;
}

/**
 * D0 kinds from playbook §03 combinations.
 * Website on file never uses A/B (do not attack site quality).
 */
export function resolveD0Kind(
  signals: readonly string[],
  hasWebsite: boolean,
): D0Kind | null {
  const set = new Set(playbookSignalsOf(signals));
  const noWebsite = set.has("NO_WEBSITE") && !hasWebsite;
  const rating = set.has("HIGH_RATING");
  const reviews = set.has("HIGH_REVIEWS");

  if (noWebsite && (rating || reviews)) {
    return "A";
  }
  if (noWebsite) {
    return "B";
  }
  if (rating && reviews) {
    return "C";
  }
  return null;
}

export function resolveCommercialTemplate(input: {
  signals: readonly string[];
  step: CadenceStep;
  hasWebsite: boolean;
}): CommercialTemplate | null {
  const { step, signals, hasWebsite } = input;

  if (step === "REACTIVATION") {
    return null;
  }

  if (step === "D2") {
    return PLAYBOOK_TEMPLATES.d2;
  }
  if (step === "D5") {
    return PLAYBOOK_TEMPLATES.d5;
  }
  if (step === "D9") {
    return PLAYBOOK_TEMPLATES.d9;
  }

  const kind = resolveD0Kind(signals, hasWebsite);
  if (kind === "A") {
    return PLAYBOOK_TEMPLATES.d0A;
  }
  if (kind === "B") {
    return PLAYBOOK_TEMPLATES.d0B;
  }
  if (kind === "C") {
    return PLAYBOOK_TEMPLATES.d0C;
  }
  return null;
}

export type PlaybookTemplateVars = {
  contactName: string | null | undefined;
  companyName: string;
  city?: string;
};

export function interpolatePlaybookMessage(
  template: string,
  vars: PlaybookTemplateVars,
): string {
  const company = vars.companyName.trim();
  const city = (vars.city ?? PLAYBOOK_CITY).trim() || PLAYBOOK_CITY;
  const name = vars.contactName?.trim() ?? "";

  let text = template;

  if (name) {
    text = text.replaceAll("{{contactName}}", name);
  } else {
    text = text.replace(
      /^\{\{contactName\}\},\s*último/u,
      `${CONTACT_NAME_FALLBACK} Último`,
    );
    text = text.replace(/^Oi, \{\{contactName\}\}\.\s*/u, `${CONTACT_NAME_FALLBACK} `);
    text = text.replace(/^\{\{contactName\}\},\s*/u, `${CONTACT_NAME_FALLBACK} `);
    text = text.replaceAll("{{contactName}}", "");
  }

  text = text.replaceAll("{{companyName}}", company);
  text = text.replaceAll("{{city}}", city);
  text = text.replace(/\{\{[^}]+\}\}/g, "").replace(/[ \t]{2,}/g, " ").trim();

  return text;
}

export function assertsNoSiteQualityAttack(text: string): boolean {
  return !SITE_QUALITY_ATTACK.test(text);
}
