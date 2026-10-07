import { parseMyQueueFilter, type MyQueueFilter } from "@/features/leads/my-queue";

import type { BreadcrumbItemModel, LeadNavOrigin } from "./breadcrumb.types";

/** 1-based page from query; invalid / missing → 1. Kept local (no pagination module on this branch). */
function parsePageParam(value: string | number | undefined): number {
  const n =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.floor(n);
}

const LEAD_NAV_ORIGINS: ReadonlySet<string> = new Set([
  "my-leads",
  "intelligence",
  "pipeline",
  "leads",
  // Legacy alias from Mobile Experience queue links
  "queue",
]);

export function parseLeadNavOrigin(
  value: string | undefined,
): LeadNavOrigin {
  if (!value || !LEAD_NAV_ORIGINS.has(value)) {
    return "leads";
  }
  if (value === "queue") {
    return "my-leads";
  }
  return value as LeadNavOrigin;
}

export function originLabel(origin: LeadNavOrigin): string {
  switch (origin) {
    case "my-leads":
      return "Minha fila";
    case "intelligence":
      return "Inteligência";
    case "pipeline":
      return "Pipeline";
    case "leads":
      return "Leads";
  }
}

function queuePageParam(page?: string | number): number | undefined {
  const parsed = parsePageParam(page);
  return parsed > 1 ? parsed : undefined;
}

export function buildLeadReturnHref(
  origin: LeadNavOrigin,
  filter?: string,
  page?: string | number,
): string {
  switch (origin) {
    case "my-leads": {
      const parsed = parseMyQueueFilter(filter);
      const safePage = queuePageParam(page);
      if (parsed === "all") {
        return "/app/my-leads";
      }
      const params = new URLSearchParams({ filter: parsed });
      if (safePage) {
        params.set("page", String(safePage));
      }
      return `/app/my-leads?${params.toString()}`;
    }
    case "intelligence":
      return "/app/intelligence";
    case "pipeline":
      return "/app/pipeline";
    case "leads":
      return "/app/leads";
  }
}

export function buildLeadDetailHref(
  leadId: string,
  origin: LeadNavOrigin,
  filter?: MyQueueFilter | string,
  page?: string | number,
): string {
  const params = new URLSearchParams({ from: origin });
  if (origin === "my-leads" && filter) {
    const parsed = parseMyQueueFilter(
      typeof filter === "string" ? filter : filter,
    );
    if (parsed !== "all") {
      params.set("filter", parsed);
      const safePage = queuePageParam(page);
      if (safePage) {
        params.set("page", String(safePage));
      }
    }
  }
  return `/app/leads/${leadId}?${params.toString()}`;
}

export function leadBreadcrumbItems(
  companyName: string,
  from: string | undefined,
  filter?: string,
  page?: string | number,
): {
  items: BreadcrumbItemModel[];
  returnHref: string;
  origin: LeadNavOrigin;
} {
  const origin = parseLeadNavOrigin(from);
  const returnHref = buildLeadReturnHref(origin, filter, page);
  return {
    origin,
    returnHref,
    items: [
      { label: originLabel(origin), href: returnHref },
      { label: companyName },
    ],
  };
}
