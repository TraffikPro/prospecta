import { AGENT_VERSION } from "./limits";
import type { AnalysisMemory, EvidenceRecord } from "./memory";
import {
  analysisReportSchema,
  type AnalysisReport,
  type DraftReport,
} from "./schemas";

export const UNVERIFIED_LIMITATION =
  "Afirmações sem evidência verificável nesta execução foram omitidas.";
export const BLOCKED_WEBSITE_LIMITATION =
  "O website informado no cadastro não é um endereço público permitido para consulta.";
export const INSUFFICIENT_LIMITATION =
  "A pesquisa não reuniu evidência suficiente para uma hipótese comercial.";

const NUMBER_PATTERN = /\d{2,}/g;

export function introducedNumbers(text: string): string[] {
  return text.match(NUMBER_PATTERN) ?? [];
}

export function introducesUnknownNumbers(
  text: string,
  records: readonly EvidenceRecord[],
  contextText: string,
): boolean {
  const allowed = new Set([
    ...introducedNumbers(contextText),
    ...records.flatMap((record) => introducedNumbers(record.text)),
  ]);
  return introducedNumbers(text).some((value) => !allowed.has(value));
}

export function supportsClaim(
  text: string,
  evidenceIds: readonly string[],
  memory: AnalysisMemory,
): boolean {
  if (evidenceIds.length === 0) {
    return false;
  }
  const records: EvidenceRecord[] = [];
  for (const id of evidenceIds) {
    const record = memory.get(id);
    if (!record) {
      return false;
    }
    records.push(record);
  }
  return !introducesUnknownNumbers(text, records, memory.contextText());
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function websiteFlag(
  memory: AnalysisMemory,
): AnalysisReport["digitalPresence"]["hasPublicWebsite"] {
  if (memory.websiteState === "fetched") return true;
  if (memory.websiteState === "failed" || memory.websiteState === "ready") {
    return "unknown";
  }
  return false;
}

export function publishReport(input: {
  draft: DraftReport;
  memory: AnalysisMemory;
  model: string;
  researchedAt: string;
}): {
  report: AnalysisReport;
  status: AnalysisReport["status"];
  downgraded: boolean;
} {
  const observations = input.draft.digitalPresence.observations.filter(
    (observation) =>
      supportsClaim(observation.statement, observation.evidenceIds, input.memory),
  );
  const opportunities = input.draft.opportunities.filter((opportunity) =>
    supportsClaim(
      `${opportunity.hypothesis} ${opportunity.rationale}`,
      opportunity.evidenceIds,
      input.memory,
    ),
  );

  let status = input.draft.status;
  let summary = input.draft.summary;
  let publishedOpportunities = opportunities;
  let downgraded = false;
  const limitations = [...input.draft.limitations];

  if (
    input.memory.websiteState === "blocked" &&
    !limitations.includes(BLOCKED_WEBSITE_LIMITATION)
  ) {
    limitations.push(BLOCKED_WEBSITE_LIMITATION);
  }

  if (summary && introducesUnknownNumbers(summary, input.memory.pages, input.memory.contextText())) {
    summary = null;
  }

  const removedClaims =
    observations.length !== input.draft.digitalPresence.observations.length ||
    opportunities.length !== input.draft.opportunities.length;

  if (status === "COMPLETE" && (observations.length === 0 || removedClaims)) {
    status = "INCONCLUSIVE";
    summary = null;
    publishedOpportunities = [];
    downgraded = true;
  }

  if (status === "INCONCLUSIVE") {
    publishedOpportunities = [];
    if (
      observations.length === 0 &&
      !limitations.includes(INSUFFICIENT_LIMITATION)
    ) {
      limitations.push(INSUFFICIENT_LIMITATION);
    }
  }

  if (downgraded && !limitations.includes(UNVERIFIED_LIMITATION)) {
    limitations.push(UNVERIFIED_LIMITATION);
  }
  const boundedLimitations = limitations.slice(0, 8);

  const evidenceIds = unique([
    ...observations.flatMap((observation) => observation.evidenceIds),
    ...publishedOpportunities.flatMap((opportunity) => opportunity.evidenceIds),
  ]);
  const evidence = evidenceIds.flatMap((id) => {
    const record = input.memory.get(id);
    if (!record) return [];
    return [
      {
        id: record.id,
        url: record.url,
        collectedAt: record.collectedAt,
        excerpt: record.excerpt.slice(0, 500),
      },
    ];
  });

  const report = analysisReportSchema.parse({
    schemaVersion: "1",
    status,
    researchedAt: input.researchedAt,
    agentVersion: AGENT_VERSION,
    model: input.model,
    summary,
    digitalPresence: {
      hasPublicWebsite: websiteFlag(input.memory),
      observations,
    },
    opportunities: publishedOpportunities,
    insufficientInformation: input.draft.insufficientInformation,
    limitations: boundedLimitations,
    evidence,
  });

  return { report, status, downgraded };
}
