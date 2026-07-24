import {
  portfolioCatalogSchema,
  type PortfolioModel,
  type PortfolioNiche,
} from "./portfolio.schema";

/**
 * Versioned commercial portfolio catalog (V1).
 * No Prisma — edit this file to publish new demonstrative models.
 * Copy and labels must stay as "modelo / site-conceito", never "cliente" or "resultado".
 */
const RAW_CATALOG = [
  {
    id: "odontologia-clinica-familiar",
    title: "Clínica Sorriso",
    niche: "DENTISTRY",
    description:
      "Site demonstrativo para clínicas que precisam apresentar tratamentos e facilitar o primeiro contato.",
    features: [
      "Tratamentos",
      "Equipe",
      "WhatsApp",
      "Localização",
      "Agendamento",
    ],
    // Use index.html explicitly — Next redirects trailing-slash dirs to a 404 path.
    previewUrl: "/portfolio/odontologia-familiar/index.html",
    coverAccent: "teal",
  },
  {
    id: "odontologia-premium-estetica",
    title: "Atelier Dental",
    niche: "DENTISTRY",
    description:
      "Modelo premium para odontologia estética — foco em confiança, procedimentos e diferenciação visual.",
    features: [
      "Procedimentos",
      "Antes e depois (conceito)",
      "Agendamento",
      "WhatsApp",
      "Credenciais",
    ],
    previewUrl: "/portfolio/odontologia-premium/index.html",
    coverAccent: "slate",
  },
  {
    id: "odontologia-consultorio-individual",
    title: "Dr. Consultório",
    niche: "DENTISTRY",
    description:
      "Site-conceito enxuto para profissional individual — presença clara, contato rápido e localização.",
    features: [
      "Sobre o profissional",
      "Serviços",
      "WhatsApp",
      "Localização",
      "Horários",
    ],
    previewUrl: "/portfolio/odontologia-individual/index.html",
    coverAccent: "amber",
  },
] as const;

export const PORTFOLIO_CATALOG: PortfolioModel[] =
  portfolioCatalogSchema.parse(RAW_CATALOG);

export function listAvailableNiches(
  catalog: PortfolioModel[] = PORTFOLIO_CATALOG,
): PortfolioNiche[] {
  const order: PortfolioNiche[] = [
    "DENTISTRY",
    "AESTHETICS",
    "RESTAURANTS",
    "LAW",
    "LOCAL_SERVICES",
  ];
  const present = new Set(catalog.map((item) => item.niche));
  return order.filter((niche) => present.has(niche));
}

export function getPortfolioModelById(
  id: string,
  catalog: PortfolioModel[] = PORTFOLIO_CATALOG,
): PortfolioModel | undefined {
  return catalog.find((item) => item.id === id);
}
