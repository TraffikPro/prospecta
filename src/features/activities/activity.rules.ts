import type { ActivityOutcome, ActivityType, LeadStage } from "@prisma/client";

/** Form-selectable types (STAGE_CHANGE is system-only). */
export const USER_ACTIVITY_TYPES = ["WHATSAPP", "EMAIL", "NOTE"] as const;

export type UserActivityType = (typeof USER_ACTIVITY_TYPES)[number];

const OUTCOMES_REQUIRING_FOLLOW_UP: ReadonlySet<ActivityOutcome> = new Set([
  "INTERESTED",
  "MEETING_SCHEDULED",
  "SENT_NO_REPLY",
]);

const OUTCOMES_WITHOUT_FOLLOW_UP: ReadonlySet<ActivityOutcome> = new Set([
  "NOT_INTERESTED",
  "WRONG_CONTACT",
]);

export function isUserActivityType(type: string): type is UserActivityType {
  return (USER_ACTIVITY_TYPES as readonly string[]).includes(type);
}

export function outcomeRequiresFollowUp(
  outcome: ActivityOutcome | null | undefined,
): boolean {
  if (!outcome) {
    return false;
  }
  if (OUTCOMES_WITHOUT_FOLLOW_UP.has(outcome)) {
    return false;
  }
  return OUTCOMES_REQUIRING_FOLLOW_UP.has(outcome);
}

/** REPLIED is optional ("depende"); treated as not strictly required. */
export function shouldRequireNextFollowUp(input: {
  type: ActivityType | UserActivityType;
  outcome: ActivityOutcome | null | undefined;
}): boolean {
  if (input.type === "NOTE") {
    return false;
  }
  return outcomeRequiresFollowUp(input.outcome);
}

export function shouldAutoMoveToContacted(stage: LeadStage): boolean {
  return stage === "NEW" || stage === "QUALIFIED";
}

export function isOutreachType(type: ActivityType | UserActivityType): boolean {
  return type === "WHATSAPP" || type === "EMAIL";
}
