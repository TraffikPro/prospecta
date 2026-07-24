import { parseMyQueueFilter, type MyQueueFilter } from "@/features/leads/my-queue";

import type { BreadcrumbItemModel, LeadNavOrigin } from "./breadcrumb.types";

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

export function buildLeadReturnHref(
  origin: LeadNavOrigin,
  filter?: string,
): string {
  switch (origin) {
    case "my-leads": {
      const parsed = parseMyQueueFilter(filter);
      return parsed === "all"
        ? "/app/my-leads"
        : `/app/my-leads?filter=${parsed}`;
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
): string {
  const params = new URLSearchParams({ from: origin });
  if (origin === "my-leads" && filter) {
    const parsed = parseMyQueueFilter(
      typeof filter === "string" ? filter : filter,
    );
    if (parsed !== "all") {
      params.set("filter", parsed);
    }
  }
  return `/app/leads/${leadId}?${params.toString()}`;
}

export function leadBreadcrumbItems(
  companyName: string,
  from: string | undefined,
  filter?: string,
): {
  items: BreadcrumbItemModel[];
  returnHref: string;
  origin: LeadNavOrigin;
} {
  const origin = parseLeadNavOrigin(from);
  const returnHref = buildLeadReturnHref(origin, filter);
  return {
    origin,
    returnHref,
    items: [
      { label: originLabel(origin), href: returnHref },
      { label: companyName },
    ],
  };
}
