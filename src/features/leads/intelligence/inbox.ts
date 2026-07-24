import type { LeadSource } from "@prisma/client";

import { parseLeadIntelligence } from "./parse-intelligence";
import { resolveQualification } from "./qualification";
import type { LeadIntelligence, LeadQualification } from "./types";

export type IntelligenceQualificationFilter = "ALL" | "HIGH" | "MEDIUM";
export type IntelligenceSourceFilter = "ALL" | "GOOGLE_PLACES" | "MANUAL";

export type IntelligenceInboxFilters = {
  qualification: IntelligenceQualificationFilter;
  source: IntelligenceSourceFilter;
};

export type IntelligenceInboxLead = {
  id: string;
  companyName: string;
  source: LeadSource;
  intelligence: LeadIntelligence;
  qualification: LeadQualification;
  score: number;
};

export function parseInboxFilters(input: {
  qualification?: string | string[] | undefined;
  source?: string | string[] | undefined;
}): IntelligenceInboxFilters {
  const qualificationRaw = Array.isArray(input.qualification)
    ? input.qualification[0]
    : input.qualification;
  const sourceRaw = Array.isArray(input.source) ? input.source[0] : input.source;

  const qualification: IntelligenceQualificationFilter =
    qualificationRaw === "HIGH" || qualificationRaw === "MEDIUM"
      ? qualificationRaw
      : "ALL";

  const source: IntelligenceSourceFilter =
    sourceRaw === "GOOGLE_PLACES" || sourceRaw === "MANUAL"
      ? sourceRaw
      : "ALL";

  return { qualification, source };
}

type InboxCandidate = {
  id: string;
  companyName: string;
  source: LeadSource;
  intelligence: unknown;
};

/**
 * Pure projection: parse, filter, sort by score desc for the operational inbox.
 */
export function buildIntelligenceInbox(
  leads: InboxCandidate[],
  filters: IntelligenceInboxFilters,
): IntelligenceInboxLead[] {
  const items: IntelligenceInboxLead[] = [];

  for (const lead of leads) {
    const intelligence = parseLeadIntelligence(lead.intelligence);
    if (!intelligence) {
      continue;
    }

    const qualification = resolveQualification(intelligence);
    if (!qualification) {
      continue;
    }

    if (typeof intelligence.score !== "number") {
      continue;
    }

    if (
      filters.qualification !== "ALL" &&
      qualification !== filters.qualification
    ) {
      continue;
    }

    if (filters.source !== "ALL" && lead.source !== filters.source) {
      continue;
    }

    items.push({
      id: lead.id,
      companyName: lead.companyName,
      source: lead.source,
      intelligence,
      qualification,
      score: intelligence.score,
    });
  }

  items.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.companyName.localeCompare(b.companyName, "pt-BR");
  });

  return items;
}

export function countByQualification(
  items: IntelligenceInboxLead[],
): Record<LeadQualification, number> {
  return {
    HIGH: items.filter((item) => item.qualification === "HIGH").length,
    MEDIUM: items.filter((item) => item.qualification === "MEDIUM").length,
    LOW: items.filter((item) => item.qualification === "LOW").length,
  };
}
