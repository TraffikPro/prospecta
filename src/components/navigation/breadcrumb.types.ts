export type BreadcrumbItemModel = {
  label: string;
  /** Omit on the current page (non-link). */
  href?: string;
};

/** Allowlisted lead detail origins — never accept arbitrary return URLs. */
export type LeadNavOrigin =
  | "my-leads"
  | "intelligence"
  | "pipeline"
  | "leads";
