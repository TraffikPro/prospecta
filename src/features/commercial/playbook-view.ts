import type { LeadIntelligence } from "@/features/leads/intelligence/types";
import { resolveQualification } from "@/features/leads/intelligence/qualification";
import { toWhatsAppUrl } from "@/features/leads/whatsapp-url";

import {
  CADENCE_STEPS,
  CONTACT_NAME_FALLBACK,
  PLAYBOOK_NO_TEMPLATE,
  PLAYBOOK_QUICK_REPLIES,
  PLAYBOOK_SIGNAL_LABELS,
  PLAYBOOK_UNAVAILABLE,
  type CadenceStep,
  type CommercialSignal,
  hasInformedWebsite,
  interpolatePlaybookMessage,
  isPlaybookIcp,
  playbookSignalsOf,
  resolveCommercialTemplate,
} from "./playbook-v1";

export type PlaybookLeadSnapshot = {
  companyName: string;
  contactName: string | null;
  phone: string | null;
  website: string | null;
  intelligence: LeadIntelligence | null;
};

export type PlaybookReason = {
  code: CommercialSignal;
  label: string;
  text: string;
};

export type PlaybookStepMessage = {
  step: CadenceStep;
  label: string;
  found: boolean;
  text: string;
};

export type PlaybookQuickReply = {
  id: string;
  label: string;
  text: string;
};

export type CommercialPlaybookView =
  | {
      status: "unavailable";
      message: string;
    }
  | {
      status: "available";
      reasons: PlaybookReason[];
      whatsappUrl: string | null;
      steps: PlaybookStepMessage[];
      replies: PlaybookQuickReply[];
      contactFallback: string;
    };

function formatRating(rating: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

function formatReviews(reviews: number): string {
  return new Intl.NumberFormat("pt-BR").format(reviews);
}

function reasonText(
  code: CommercialSignal,
  rating: number | undefined,
  reviews: number | undefined,
): string {
  if (code === "NO_WEBSITE") {
    return "A empresa não possui site informado na ficha.";
  }
  if (code === "HIGH_RATING") {
    if (typeof rating === "number") {
      return `Possui boa reputação: ${formatRating(rating)} estrelas.`;
    }
    return "Possui boa reputação no Google.";
  }
  if (typeof reviews === "number") {
    return `Possui volume relevante de avaliações: ${formatReviews(reviews)}.`;
  }
  return "Possui volume relevante de avaliações.";
}

function buildReasons(
  signals: readonly string[],
  hasWebsite: boolean,
  rating: number | undefined,
  reviews: number | undefined,
): PlaybookReason[] {
  const reasons: PlaybookReason[] = [];
  for (const code of playbookSignalsOf(signals)) {
    if (code === "NO_WEBSITE" && hasWebsite) {
      continue;
    }
    reasons.push({
      code,
      label: PLAYBOOK_SIGNAL_LABELS[code],
      text: reasonText(code, rating, reviews),
    });
  }
  return reasons;
}

export function buildCommercialPlaybookView(
  lead: PlaybookLeadSnapshot,
): CommercialPlaybookView {
  const intelligence = lead.intelligence;
  const qualification = intelligence
    ? resolveQualification(intelligence)
    : undefined;

  if (
    !isPlaybookIcp({
      qualification,
      campaign: intelligence?.campaign,
      phone: lead.phone,
    })
  ) {
    return { status: "unavailable", message: PLAYBOOK_UNAVAILABLE };
  }

  const hasWebsite = hasInformedWebsite(lead.website);
  const signals = intelligence?.signals ?? [];
  const vars = {
    contactName: lead.contactName,
    companyName: lead.companyName,
  };

  const steps: PlaybookStepMessage[] = CADENCE_STEPS.map((item) => {
    const template = resolveCommercialTemplate({
      signals,
      step: item.value,
      hasWebsite,
    });
    if (!template) {
      return {
        step: item.value,
        label: item.label,
        found: false,
        text: PLAYBOOK_NO_TEMPLATE,
      };
    }
    return {
      step: item.value,
      label: item.label,
      found: true,
      text: interpolatePlaybookMessage(template.message, vars),
    };
  });

  return {
    status: "available",
    reasons: buildReasons(
      signals,
      hasWebsite,
      intelligence?.rating,
      intelligence?.reviews,
    ),
    whatsappUrl: toWhatsAppUrl(lead.phone),
    steps,
    replies: PLAYBOOK_QUICK_REPLIES.map((reply) => ({
      id: reply.id,
      label: reply.label,
      text: reply.text,
    })),
    contactFallback: CONTACT_NAME_FALLBACK,
  };
}
