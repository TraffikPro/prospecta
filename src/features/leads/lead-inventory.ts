import type { LeadStage, Prisma } from "@prisma/client";

import type { LeadListScope } from "@/server/auth/lead-access";

import { LEAD_STAGE_ORDER } from "./lead.labels";

export type LeadInventoryStageFilter = LeadStage | "ALL";

export type LeadInventoryFilters = {
  q: string;
  stage: LeadInventoryStageFilter;
  /** ADMIN-only; ignored when building MEMBER-scoped where. */
  ownerId: string | null;
  /** 1-based page from URL (clamped later against total). */
  page: number;
};

export const LEAD_INVENTORY_STAGE_OPTIONS: LeadInventoryStageFilter[] = [
  "ALL",
  ...LEAD_STAGE_ORDER,
];

export function parseLeadInventoryFilters(input: {
  q?: string | string[];
  stage?: string | string[];
  owner?: string | string[];
  page?: string | string[];
}): LeadInventoryFilters {
  const qRaw = Array.isArray(input.q) ? input.q[0] : input.q;
  const stageRaw = Array.isArray(input.stage) ? input.stage[0] : input.stage;
  const ownerRaw = Array.isArray(input.owner) ? input.owner[0] : input.owner;
  const pageRaw = Array.isArray(input.page) ? input.page[0] : input.page;

  const q = (qRaw ?? "").trim().slice(0, 120);

  const stage: LeadInventoryStageFilter =
    stageRaw &&
    (LEAD_STAGE_ORDER as readonly string[]).includes(stageRaw)
      ? (stageRaw as LeadStage)
      : "ALL";

  const ownerId =
    ownerRaw && /^[a-z0-9_-]{1,64}$/i.test(ownerRaw) ? ownerRaw : null;

  const pageParsed = Number.parseInt(String(pageRaw ?? ""), 10);
  const page =
    Number.isFinite(pageParsed) && pageParsed >= 1
      ? Math.floor(pageParsed)
      : 1;

  return { q, stage, ownerId, page };
}

export function leadInventoryHasActiveFilters(
  filters: LeadInventoryFilters,
  options: { ownerFilterEnabled: boolean },
): boolean {
  if (filters.q.length > 0) return true;
  if (filters.stage !== "ALL") return true;
  if (options.ownerFilterEnabled && filters.ownerId) return true;
  return false;
}

/**
 * Authoritative inventory WHERE — ownership always applied from scope,
 * never from client alone.
 */
export function buildLeadInventoryWhere(input: {
  scope: LeadListScope;
  filters: LeadInventoryFilters;
}): Prisma.LeadWhereInput {
  const { scope, filters } = input;
  const where: Prisma.LeadWhereInput = {};

  if (scope.access === "owner") {
    where.ownerId = scope.ownerId;
  } else if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }

  if (filters.stage !== "ALL") {
    where.stage = filters.stage;
  }

  if (filters.q.length > 0) {
    where.OR = [
      { companyName: { contains: filters.q, mode: "insensitive" } },
      { contactName: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export function inventoryHref(
  filters: Partial<LeadInventoryFilters>,
  options: { omitPage?: boolean } = {},
): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim() ?? "";
  const stage = filters.stage ?? "ALL";
  const ownerId = filters.ownerId ?? null;
  const page = filters.page ?? 1;
  if (q) params.set("q", q);
  if (stage !== "ALL") params.set("stage", stage);
  if (ownerId) params.set("owner", ownerId);
  if (!options.omitPage && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/app/leads?${query}` : "/app/leads";
}
