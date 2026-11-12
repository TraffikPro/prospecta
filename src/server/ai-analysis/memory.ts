import type { AuthorizedLeadContext } from "./schemas";

export type EvidenceRecord = {
  id: string;
  url: string;
  collectedAt: string;
  excerpt: string;
  text: string;
};

export type WebsiteState = "absent" | "blocked" | "ready" | "fetched" | "failed";

export class AnalysisMemory {
  context: AuthorizedLeadContext | null = null;
  websiteState: WebsiteState = "absent";
  readonly pages: EvidenceRecord[] = [];
  readonly matches: EvidenceRecord[] = [];
  extractedChars = 0;
  private pageSequence = 0;
  private matchSequence = 0;

  setContext(context: AuthorizedLeadContext, websiteState: WebsiteState): void {
    this.context = context;
    this.websiteState = websiteState;
  }

  hasPage(url: string): boolean {
    return this.pages.some((page) => page.url === url);
  }

  pageByUrl(url: string): EvidenceRecord | undefined {
    return this.pages.find((page) => page.url === url);
  }

  addPage(input: {
    url: string;
    collectedAt: string;
    text: string;
    excerpt: string;
  }): EvidenceRecord {
    this.pageSequence += 1;
    const record: EvidenceRecord = {
      id: `ev_page_${this.pageSequence}`,
      url: input.url,
      collectedAt: input.collectedAt,
      excerpt: input.excerpt,
      text: input.text,
    };
    this.pages.push(record);
    this.extractedChars += input.text.length;
    this.websiteState = "fetched";
    return record;
  }

  addMatch(input: {
    url: string;
    collectedAt: string;
    excerpt: string;
    text: string;
  }): EvidenceRecord {
    this.matchSequence += 1;
    const record: EvidenceRecord = {
      id: `ev_match_${this.matchSequence}`,
      url: input.url,
      collectedAt: input.collectedAt,
      excerpt: input.excerpt,
      text: input.text,
    };
    this.matches.push(record);
    return record;
  }

  get(id: string): EvidenceRecord | undefined {
    return (
      this.pages.find((page) => page.id === id) ??
      this.matches.find((match) => match.id === id)
    );
  }

  contextText(): string {
    if (!this.context) return "";
    const reputation = this.context.reputation;
    return [
      this.context.companyName,
      this.context.website ?? "",
      reputation.qualification ?? "",
      reputation.signals.join(" "),
      reputation.score?.toString() ?? "",
      reputation.rating?.toString() ?? "",
      reputation.reviews?.toString() ?? "",
    ].join(" ");
  }
}

export function searchTerms(query: string): string[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4);
  if (terms.length > 0) {
    return terms;
  }
  const compact = query.toLowerCase().trim();
  return compact.length >= 4 ? [compact] : [];
}

export function searchPages(
  memory: AnalysisMemory,
  query: string,
  collectedAt: string,
): EvidenceRecord[] {
  const terms = searchTerms(query);
  if (terms.length === 0) {
    return [];
  }
  const existing = memory.matches.filter((match) =>
    terms.every((term) => match.text.toLowerCase().includes(term)),
  );
  if (existing.length > 0) {
    return existing;
  }

  const found: EvidenceRecord[] = [];
  for (const page of memory.pages) {
    const haystack = page.text.toLowerCase();
    if (!terms.every((term) => haystack.includes(term))) {
      continue;
    }
    const anchor = haystack.indexOf(terms[0] ?? "");
    const start = Math.max(0, anchor - 80);
    const excerpt = page.text.slice(start, start + 240).trim();
    found.push(
      memory.addMatch({
        url: page.url,
        collectedAt,
        excerpt,
        text: excerpt,
      }),
    );
    if (found.length >= 3) {
      break;
    }
  }
  return found;
}
