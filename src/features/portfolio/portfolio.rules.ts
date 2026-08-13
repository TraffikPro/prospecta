import type { ActivityOutcome, ActivityType } from "@prisma/client";

import { isOutreachType } from "@/features/activities/activity.rules";

/** Fase 1: treated = WhatsApp/e-mail with outcome after assignment. */
export function isValidTreatmentActivity(input: {
  type: ActivityType;
  outcome: ActivityOutcome | null | undefined;
  activityCreatedAt: Date;
  assignedAt: Date;
  authorId: string;
  assigneeId: string;
}): boolean {
  if (!isOutreachType(input.type)) return false;
  if (!input.outcome) return false;
  if (input.authorId !== input.assigneeId) return false;
  return input.activityCreatedAt.getTime() >= input.assignedAt.getTime();
}

/** Suggested value for ADMIN form when no quota exists yet — not an implicit meta. */
export const SUGGESTED_WEEKLY_TARGET = 10;
export const MAX_WEEKLY_TARGET = 50;
export const MIN_WEEKLY_TARGET = 1;
