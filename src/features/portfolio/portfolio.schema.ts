import { z } from "zod";

/** Commercial niches that may appear in the portfolio catalog. */
export const portfolioNicheSchema = z.enum([
  "DENTISTRY",
  "AESTHETICS",
  "RESTAURANTS",
  "LAW",
  "LOCAL_SERVICES",
]);

export type PortfolioNiche = z.infer<typeof portfolioNicheSchema>;

export const portfolioModelSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  niche: portfolioNicheSchema,
  description: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  /** Public demo path or absolute URL. Relative paths resolve against the app origin. */
  previewUrl: z.string().min(1),
  /** Optional static cover under /public; cards fall back to accent cover. */
  coverImage: z.string().optional(),
  /** Chakra color token key for gradient cover when coverImage is absent. */
  coverAccent: z.enum(["teal", "slate", "amber"]).default("teal"),
});

export type PortfolioModel = z.infer<typeof portfolioModelSchema>;

export const portfolioCatalogSchema = z.array(portfolioModelSchema).min(0);

export const portfolioNicheFilterSchema = z.enum([
  "ALL",
  ...portfolioNicheSchema.options,
]);

export type PortfolioNicheFilter = z.infer<typeof portfolioNicheFilterSchema>;
