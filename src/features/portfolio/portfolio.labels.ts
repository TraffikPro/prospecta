import type { PortfolioNiche } from "./portfolio.schema";

export const portfolioNicheLabels: Record<PortfolioNiche, string> = {
  DENTISTRY: "Odontologia",
  AESTHETICS: "Estética",
  RESTAURANTS: "Restaurantes",
  LAW: "Advocacia",
  LOCAL_SERVICES: "Serviços locais",
};

/** Disclaimer shown on every portfolio surface — never imply real client cases. */
export const PORTFOLIO_DISCLAIMER =
  "Modelos demonstrativos e sites-conceito para o segmento — não são cases de clientes.";
