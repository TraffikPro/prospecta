import type { ActivityOutcome, ActivityType, LeadStage } from "@prisma/client";

import { isOutreachType } from "@/features/activities/activity.rules";
import { parseLeadIntelligence } from "@/features/leads/intelligence/parse-intelligence";
import { resolveQualification } from "@/features/leads/intelligence/qualification";

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

/** Max commercial assignment cycles per lead (F2). */
export const HIGH_ASSIGNMENT_CAP = 2;
export const RELEASE_REASON_ADMIN_REASSIGN = "ADMIN_REASSIGN";
export const RELEASE_REASON_RECYCLED = "RECYCLED";
export const RELEASE_REASON_WEEK_CLOSED = "WEEK_CLOSED";

export type AssignmentCycleInput = {
  status: "ACTIVE" | "TREATED" | "RELEASED";
  releaseReason: string | null;
};

function isNonCommercialRelease(reason: string | null): boolean {
  return (
    reason === RELEASE_REASON_ADMIN_REASSIGN ||
    reason === RELEASE_REASON_WEEK_CLOSED
  );
}

/**
 * One LeadAssignment row is one commercial cycle, except F1 ADMIN_REASSIGN
 * leftovers (transfer of the same attempt) and F4 WEEK_CLOSED (temporal close).
 */
export function countsAsCommercialCycle(
  assignment: AssignmentCycleInput,
): boolean {
  return !(
    assignment.status === "RELEASED" &&
    isNonCommercialRelease(assignment.releaseReason)
  );
}

export function countCommercialCycles(
  assignments: AssignmentCycleInput[],
): number {
  return assignments.filter(countsAsCommercialCycle).length;
}

export function isHighQualification(intelligence: unknown): boolean {
  const parsed = parseLeadIntelligence(intelligence);
  if (!parsed) return false;
  return resolveQualification(parsed) === "HIGH";
}

export function isTerminalLeadStage(stage: LeadStage | string): boolean {
  return stage === "WON" || stage === "LOST";
}

export type HighPoolBucket =
  | "eligible"
  | "assigned"
  | "recyclable"
  | "capped";

export function classifyHighPoolLead(input: {
  intelligence: unknown;
  stage: LeadStage | string;
  assignments: AssignmentCycleInput[];
}): HighPoolBucket | null {
  const cycles = countCommercialCycles(input.assignments);
  const hasActive = input.assignments.some(
    (assignment) => assignment.status === "ACTIVE",
  );
  const hasTreated = input.assignments.some(
    (assignment) => assignment.status === "TREATED",
  );

  if (hasActive) {
    return "assigned";
  }
  if (cycles >= HIGH_ASSIGNMENT_CAP) {
    return "capped";
  }
  if (hasTreated) {
    return "recyclable";
  }
  if (
    isHighQualification(input.intelligence) &&
    !isTerminalLeadStage(input.stage)
  ) {
    return "eligible";
  }
  return null;
}

export function isEligibleHighPool(input: {
  intelligence: unknown;
  stage: LeadStage | string;
  assignments: AssignmentCycleInput[];
}): boolean {
  return classifyHighPoolLead(input) === "eligible";
}

export function isRecyclableHigh(input: {
  intelligence: unknown;
  stage: LeadStage | string;
  assignments: AssignmentCycleInput[];
}): boolean {
  return classifyHighPoolLead(input) === "recyclable";
}
