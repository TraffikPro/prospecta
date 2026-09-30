/**
 * Demos gallery presentation helpers (Product UI V2 / F13).
 * Showcase surface — not operational CRM density.
 */

import type { PortfolioModel } from "./portfolio.schema";

/** Primary CTA label — opens the static demo in a new tab. */
export const DEMO_OPEN_LABEL = "Abrir demo";

/** Secondary action — copies absolute demo URL. */
export const DEMO_COPY_LABEL = "Copiar link";

export const DEMOS_PAGE_TITLE = "Demos comerciais";

export const DEMOS_PAGE_META =
  "Sites-conceito para mostrar a um prospect na conversa.";

/** Max features shown on a gallery card before "+N". */
export const DEMO_CARD_FEATURE_LIMIT = 4;

export function summarizeDemoFeatures(
  features: readonly string[],
  limit = DEMO_CARD_FEATURE_LIMIT,
): { visible: string[]; overflow: number } {
  if (features.length <= limit) {
    return { visible: [...features], overflow: 0 };
  }
  return {
    visible: features.slice(0, limit),
    overflow: features.length - limit,
  };
}

/** Cover strategy for gallery tiles — never decorative mesh gradients. */
export type DemoCoverKind = "image" | "typographic";

export function resolveDemoCoverKind(model: PortfolioModel): DemoCoverKind {
  return model.coverImage ? "image" : "typographic";
}
