import {
  portfolioNicheFilterSchema,
  type PortfolioModel,
  type PortfolioNicheFilter,
} from "./portfolio.schema";

export function parsePortfolioNicheFilter(
  value: string | string[] | undefined,
): PortfolioNicheFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = portfolioNicheFilterSchema.safeParse(raw ?? "ALL");
  return parsed.success ? parsed.data : "ALL";
}

export function filterPortfolioCatalog(
  catalog: PortfolioModel[],
  niche: PortfolioNicheFilter,
): PortfolioModel[] {
  if (niche === "ALL") return catalog;
  return catalog.filter((item) => item.niche === niche);
}

export function portfolioFilterHref(niche: PortfolioNicheFilter): string {
  if (niche === "ALL") return "/app/portfolio";
  return `/app/portfolio?niche=${niche}`;
}
