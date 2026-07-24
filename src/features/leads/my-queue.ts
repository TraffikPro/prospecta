import type { ActivityOutcome, ActivityType, LeadStage } from "@prisma/client";

import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import {
  classifyFollowUp,
  getNextAction,
  type FollowUpState,
  type NextActionView,
} from "@/features/leads/next-action";

export type MyQueueBucket = "no_contact" | "overdue" | "due_today" | "other";

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
  bucket: MyQueueBucket;
  nextAction: NextActionView;
  followUpState: FollowUpState;
};

export type MyQueueSummary = {
  noContact: number;
  dueToday: number;
  overdue: number;
  total: number;
};

export type MyQueueView = {
  summary: MyQueueSummary;
  sections: Array<{
    bucket: MyQueueBucket;
    title: string;
    items: MyQueueItem[];
  }>;
};

const SECTION_ORDER: MyQueueBucket[] = [
  "no_contact",
  "overdue",
  "due_today",
  "other",
];

const SECTION_TITLE: Record<MyQueueBucket, string> = {
  no_contact: "Sem contato",
  overdue: "Atrasados",
  due_today: "Follow-up hoje",
  other: "Demais",
};

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

function sortKey(item: MyQueueItem): [number, number, string] {
  const bucketRank = SECTION_ORDER.indexOf(item.bucket);
  const scoreRank = item.score == null ? -1 : item.score;
  return [bucketRank, -scoreRank, item.companyName.toLocaleLowerCase("pt-BR")];
}

export function buildMyQueue(
  leads: MyQueueLeadInput[],
  now: Date = new Date(),
): MyQueueView {
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

    return {
      id: lead.id,
      companyName: lead.companyName,
      score,
      bucket: bucketFor({ hasCommercialActivity, followUpState }),
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
    total: items.length,
  };

  const sections = SECTION_ORDER.map((bucket) => ({
    bucket,
    title: SECTION_TITLE[bucket],
    items: items.filter((i) => i.bucket === bucket),
  })).filter((section) => section.items.length > 0);

  return { summary, sections };
}
