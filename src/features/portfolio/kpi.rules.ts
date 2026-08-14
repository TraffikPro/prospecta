import type { LeadAssignmentSource, LeadAssignmentStatus } from "@prisma/client";

import {
  RELEASE_REASON_ADMIN_REASSIGN,
  RELEASE_REASON_WEEK_CLOSED,
} from "@/features/portfolio/portfolio.rules";

/** Assignment row used by weekly commercial KPIs. Unit = LeadAssignment. */
export type KpiAssignmentRow = {
  status: LeadAssignmentStatus;
  source: LeadAssignmentSource;
  releaseReason: string | null;
  treatedAt: Date | null;
};

export type WeeklyAssignmentKpiCounts = {
  assigned: number;
  treated: number;
  pending: number;
  bySource: {
    newAcquisition: number;
    recycled: number;
    adminReassigned: number;
    other: number;
  };
  released: {
    weekClosed: number;
  };
};

/**
 * Transfer leftover (F1): same commercial attempt continues on the new row.
 * Does not occupy assigned/treated/pending of the origin operator.
 */
export function isAdminReassignLeftover(row: KpiAssignmentRow): boolean {
  return (
    row.status === "RELEASED" &&
    row.releaseReason === RELEASE_REASON_ADMIN_REASSIGN
  );
}

/** Occupied the weekly wallet as a commercial assignment (not a transfer leftover). */
export function countsTowardAssignedKpi(row: KpiAssignmentRow): boolean {
  return !isAdminReassignLeftover(row);
}

/**
 * Canonical treated flag is `treatedAt` (set by valid WHATSAPP/EMAIL activity).
 * Survives F2 recycle (status becomes RELEASED/RECYCLED).
 */
export function countsTowardTreatedKpi(row: KpiAssignmentRow): boolean {
  return countsTowardAssignedKpi(row) && row.treatedAt != null;
}

export function countsTowardPendingKpi(row: KpiAssignmentRow): boolean {
  return row.status === "ACTIVE";
}

export function countsTowardWeekClosedKpi(row: KpiAssignmentRow): boolean {
  return (
    row.status === "RELEASED" &&
    row.releaseReason === RELEASE_REASON_WEEK_CLOSED
  );
}

export function safeRate(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return 0;
  }
  if (denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

function sourceBucket(
  source: LeadAssignmentSource,
): keyof WeeklyAssignmentKpiCounts["bySource"] {
  if (source === "NEW_ACQUISITION") return "newAcquisition";
  if (source === "RECYCLED") return "recycled";
  return "other";
}

export function emptyAssignmentKpiCounts(): WeeklyAssignmentKpiCounts {
  return {
    assigned: 0,
    treated: 0,
    pending: 0,
    bySource: {
      newAcquisition: 0,
      recycled: 0,
      adminReassigned: 0,
      other: 0,
    },
    released: { weekClosed: 0 },
  };
}

export function aggregateWeeklyAssignmentKpis(
  rows: KpiAssignmentRow[],
): WeeklyAssignmentKpiCounts {
  const counts = emptyAssignmentKpiCounts();
  for (const row of rows) {
    if (isAdminReassignLeftover(row)) {
      counts.bySource.adminReassigned += 1;
      continue;
    }
    counts.assigned += 1;
    if (countsTowardTreatedKpi(row)) {
      counts.treated += 1;
    }
    if (countsTowardPendingKpi(row)) {
      counts.pending += 1;
    }
    if (countsTowardWeekClosedKpi(row)) {
      counts.released.weekClosed += 1;
    }
    counts.bySource[sourceBucket(row.source)] += 1;
  }
  return counts;
}
