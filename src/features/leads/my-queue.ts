import type { ActivityOutcome, ActivityType, LeadStage } from "@prisma/client";

import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import {
  resolveQualification,
  type LeadQualification,
} from "@/features/leads/intelligence";
import {
  classifyFollowUp,
  getNextAction,
  type FollowUpState,
  type NextActionView,
} from "@/features/leads/next-action";

export type MyQueueBucket = "overdue" | "due_today" | "no_contact" | "other";

/** Public filter query values for `/app/my-leads?filter=`. */
export type MyQueueFilter =
  | "all"
  | "new"
  | "follow-up"
  | "overdue"
  | "conversation";

export type MyQueueLeadInput = {
  id: string;
  companyName: string;
  stage: LeadStage;
  nextFollowUpAt: Date | null;
  intelligence: unknown;
  activities: Array<{
    outcome: ActivityOutcome | null;
    type: ActivityType;
  }>;
};

export type MyQueueItem = {
  id: string;
  companyName: string;
  score: number | null;
  qualification: LeadQualification | null;
  campaign: string | null;
  bucket: MyQueueBucket;
  latestOutcome: ActivityOutcome | null;
  nextAction: NextActionView;
  followUpState: FollowUpState;
};

export type MyQueueSummary = {
  noContact: number;
  dueToday: number;
  overdue: number;
  inConversation: number;
  total: number;
};

export type MyQueueView = {
  filter: MyQueueFilter;
  summary: MyQueueSummary;
  sections: Array<{
    bucket: MyQueueBucket;
    title: string;
    items: MyQueueItem[];
  }>;
  /** Flat list in priority order (useful when a filter is active). */
  items: MyQueueItem[];
};

/** Operational priority: overdue → today → no contact → rest. */
const SECTION_ORDER: MyQueueBucket[] = [
  "overdue",
  "due_today",
  "no_contact",
  "other",
];

const SECTION_TITLE: Record<MyQueueBucket, string> = {
  overdue: "Atrasados",
  due_today: "Follow-up hoje",
  no_contact: "Sem contato",
  other: "Demais",
};

export const MY_QUEUE_FILTERS: Array<{
  id: MyQueueFilter;
  label: string;
}> = [
  { id: "all", label: "Todos" },
  { id: "new", label: "Novo contato" },
  { id: "follow-up", label: "Follow-up hoje" },
  { id: "overdue", label: "Atrasados" },
  { id: "conversation", label: "Em conversa" },
];

export const MY_QUEUE_EMPTY_BY_FILTER: Record<MyQueueFilter, string> = {
  all: "Nenhum lead ativo na sua fila. Leads WON/LOST ficam de fora.",
  new: "Nenhum lead aguardando primeiro contato neste filtro.",
  "follow-up": "Nenhum follow-up para hoje neste filtro.",
  overdue: "Nenhum lead atrasado neste filtro.",
  conversation: "Nenhum lead em conversa neste filtro.",
};

export function parseMyQueueFilter(
  value: string | undefined,
): MyQueueFilter {
  switch (value) {
    case "new":
    case "follow-up":
    case "overdue":
    case "conversation":
      return value;
    // Legacy aliases from early queue slice
    case "no_contact":
      return "new";
    case "due_today":
      return "follow-up";
    case "in_conversation":
      return "conversation";
    default:
      return "all";
  }
}

function bucketFor(item: {
  hasCommercialActivity: boolean;
  followUpState: FollowUpState;
}): MyQueueBucket {
  if (!item.hasCommercialActivity) {
    return "no_contact";
  }
  if (item.followUpState === "overdue") {
    return "overdue";
  }
  if (item.followUpState === "due_today") {
    return "due_today";
  }
  return "other";
}

function isInConversation(item: MyQueueItem): boolean {
  return (
    item.latestOutcome === "REPLIED" ||
    item.latestOutcome === "INTERESTED" ||
    item.latestOutcome === "MEETING_SCHEDULED"
  );
}

function matchesFilter(item: MyQueueItem, filter: MyQueueFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "new":
      return item.bucket === "no_contact";
    case "follow-up":
      return item.bucket === "due_today";
    case "overdue":
      return item.bucket === "overdue";
    case "conversation":
      return isInConversation(item);
  }
}

function sortKey(item: MyQueueItem): [number, number, string] {
  const bucketRank = SECTION_ORDER.indexOf(item.bucket);
  const scoreRank = item.score == null ? -1 : item.score;
  return [bucketRank, -scoreRank, item.companyName.toLocaleLowerCase("pt-BR")];
}

export function formatCampaignLabel(campaign: string): string {
  const trailingPeriod = campaign.match(/^(.*?)[-_](\d{4}-\d{2})$/);
  const head = (trailingPeriod?.[1] ?? campaign)
    .split(/[-_]/)
    .filter(Boolean)
    .map(
      (part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1),
    )
    .join(" ");
  if (trailingPeriod?.[2]) {
    return `${head} ${trailingPeriod[2]}`.trim();
  }
  return head;
}

export function buildMyQueue(
  leads: MyQueueLeadInput[],
  options: { now?: Date; filter?: MyQueueFilter } = {},
): MyQueueView {
  const now = options.now ?? new Date();
  const filter = options.filter ?? "all";

  const items: MyQueueItem[] = leads.map((lead) => {
    const latest = lead.activities[0] ?? null;
    const latestOutcome = latest?.outcome ?? null;
    const hasCommercialActivity = Boolean(latest);
    const followUpState = classifyFollowUp(lead.nextFollowUpAt, now);
    const nextAction = getNextAction({
      stage: lead.stage,
      nextFollowUpAt: lead.nextFollowUpAt,
      latestOutcome,
      now,
    });
    const intelligence = parseLeadIntelligence(lead.intelligence);
    const score =
      typeof intelligence?.score === "number" ? intelligence.score : null;
    const qualification = intelligence
      ? (resolveQualification(intelligence) ?? null)
      : null;
    const campaign = intelligence?.campaign?.trim()
      ? intelligence.campaign.trim()
      : null;

    return {
      id: lead.id,
      companyName: lead.companyName,
      score,
      qualification,
      campaign,
      bucket: bucketFor({ hasCommercialActivity, followUpState }),
      latestOutcome,
      nextAction,
      followUpState,
    };
  });

  items.sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    for (let i = 0; i < ka.length; i++) {
      if (ka[i]! < kb[i]!) return -1;
      if (ka[i]! > kb[i]!) return 1;
    }
    return 0;
  });

  const summary: MyQueueSummary = {
    noContact: items.filter((i) => i.bucket === "no_contact").length,
    dueToday: items.filter((i) => i.bucket === "due_today").length,
    overdue: items.filter((i) => i.bucket === "overdue").length,
    inConversation: items.filter((i) => isInConversation(i)).length,
    total: items.length,
  };

  const filtered = items.filter((item) => matchesFilter(item, filter));

  const sections = SECTION_ORDER.map((bucket) => ({
    bucket,
    title: SECTION_TITLE[bucket],
    items: filtered.filter((i) => i.bucket === bucket),
  })).filter((section) => section.items.length > 0);

  return {
    filter,
    summary,
    sections,
    items: filtered,
  };
}
