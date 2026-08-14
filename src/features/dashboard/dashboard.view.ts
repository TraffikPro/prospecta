import { formatWeekRangePtBr } from "@/features/portfolio/week";

import { formatPercent } from "./dashboard.format";

export type DashboardKind = "operator" | "team";

export type DashboardKpiSnapshot = {
  period: {
    weekStartAt: Date;
    weekEndAt: Date;
  };
  quotaConfigured: boolean;
  target: number;
  assigned: number;
  treated: number;
  pending: number;
  treatmentRate: number;
  portfolioFillRate: number;
  treatmentTargetRate: number;
  bySource: {
    newAcquisition: number;
    recycled: number;
    adminReassigned: number;
    other: number;
  };
  released: {
    weekClosed: number;
  };
  operatorsTotal?: number;
  operatorsWithQuota?: number;
};

export type DashboardStatId = "target" | "assigned" | "treated" | "pending";

export type DashboardStatCard = {
  id: DashboardStatId;
  title: string;
  value: string;
  hint: string;
  emphasized: boolean;
};

export type DashboardProgressId =
  | "portfolioFill"
  | "treatment"
  | "treatmentTarget";

export type DashboardProgressMetric = {
  id: DashboardProgressId;
  label: string;
  rate: number;
  formatted: string;
};

export type DashboardSourceId =
  | "newAcquisition"
  | "recycled"
  | "other"
  | "adminReassigned";

export type DashboardSourceRow = {
  id: DashboardSourceId;
  label: string;
  count: number;
};

export type DashboardEmptyKind =
  | "no_quota_no_assignments"
  | "quota_empty_wallet"
  | "all_treated";

export type DashboardEmptyState = {
  kind: DashboardEmptyKind;
  title: string;
  description: string;
};

export type DashboardCta = {
  href: string;
  label: string;
};

export type DashboardView = {
  kind: DashboardKind;
  weekLabel: string;
  subtitle: string;
  cards: DashboardStatCard[];
  progress: DashboardProgressMetric[];
  sources: DashboardSourceRow[];
  weekClosedCount: number | null;
  empty: DashboardEmptyState | null;
  operatorsLine: string | null;
  primaryCta: DashboardCta;
  secondaryCtas: DashboardCta[];
};

const OPERATOR_SUBTITLE =
  "Acompanhe sua meta, carteira e execução comercial da semana.";
const TEAM_SUBTITLE =
  "Acompanhe a meta, a carteira e a execução comercial do time nesta semana.";

function sourceRows(
  kind: DashboardKind,
  bySource: DashboardKpiSnapshot["bySource"],
): DashboardSourceRow[] {
  const otherLabel = kind === "team" ? "Outros" : "Manuais";
  return [
    {
      id: "newAcquisition",
      label: "Nova aquisição",
      count: bySource.newAcquisition,
    },
    {
      id: "recycled",
      label: "Reciclados",
      count: bySource.recycled,
    },
    {
      id: "other",
      label: otherLabel,
      count: bySource.other,
    },
    {
      id: "adminReassigned",
      label: "Reatribuições",
      count: bySource.adminReassigned,
    },
  ];
}

function emptyState(
  kind: DashboardKind,
  kpis: DashboardKpiSnapshot,
): DashboardEmptyState | null {
  if (!kpis.quotaConfigured && kpis.assigned === 0) {
    return {
      kind: "no_quota_no_assignments",
      title:
        kind === "team"
          ? "A semana do time ainda não começou."
          : "Sua semana ainda não começou.",
      description:
        "A meta semanal ainda não foi configurada e não há leads atribuídos.",
    };
  }

  if (kpis.quotaConfigured && kpis.assigned === 0) {
    return {
      kind: "quota_empty_wallet",
      title:
        kind === "team"
          ? "A carteira do time ainda está vazia."
          : "Sua carteira ainda está vazia.",
      description: `Meta: ${kpis.target} ${kpis.target === 1 ? "lead" : "leads"}.`,
    };
  }

  if (kpis.assigned > 0 && kpis.pending === 0) {
    return {
      kind: "all_treated",
      title: "Tudo tratado por enquanto.",
      description:
        kind === "team"
          ? "Não há pendências agregadas nesta semana."
          : "Não há pendências na sua carteira desta semana.",
    };
  }

  return null;
}

function operatorCta(kpis: DashboardKpiSnapshot): DashboardCta {
  if (kpis.pending > 0) {
    return { href: "/app/my-leads", label: "Tratar pendências" };
  }
  if (kpis.quotaConfigured && kpis.assigned === 0) {
    return { href: "/app/my-leads", label: "Ir para Minha fila" };
  }
  return { href: "/app/my-leads", label: "Ver minha fila" };
}

function teamCtas(): { primary: DashboardCta; secondary: DashboardCta[] } {
  return {
    primary: { href: "/admin/users", label: "Ver equipe" },
    secondary: [{ href: "/admin/high-pool", label: "Revisar HIGH" }],
  };
}

function buildCards(kpis: DashboardKpiSnapshot): DashboardStatCard[] {
  const targetCard: DashboardStatCard = kpis.quotaConfigured
    ? {
        id: "target",
        title: "Meta",
        value: String(kpis.target),
        hint: "Configurada",
        emphasized: false,
      }
    : {
        id: "target",
        title: "Meta semanal",
        value: "Não configurada",
        hint: "Meta ainda não configurada pela gestão.",
        emphasized: false,
      };

  return [
    targetCard,
    {
      id: "assigned",
      title: "Atribuídos",
      value: String(kpis.assigned),
      hint: kpis.quotaConfigured
        ? `${formatPercent(kpis.portfolioFillRate)} da meta`
        : "Na semana",
      emphasized: false,
    },
    {
      id: "treated",
      title: "Tratados",
      value: String(kpis.treated),
      hint: `${formatPercent(kpis.treatmentRate)} dos atribuídos`,
      emphasized: false,
    },
    {
      id: "pending",
      title: "Pendentes",
      value: String(kpis.pending),
      hint: kpis.pending > 0 ? "Exigem ação" : "Nenhuma pendência",
      emphasized: kpis.pending > 0,
    },
  ];
}

function buildProgress(kpis: DashboardKpiSnapshot): DashboardProgressMetric[] {
  const items: DashboardProgressMetric[] = [
    {
      id: "portfolioFill",
      label: "Carteira preenchida",
      rate: kpis.portfolioFillRate,
      formatted: formatPercent(kpis.portfolioFillRate),
    },
    {
      id: "treatment",
      label: "Tratamento da carteira",
      rate: kpis.treatmentRate,
      formatted: formatPercent(kpis.treatmentRate),
    },
  ];

  if (kpis.quotaConfigured) {
    items.push({
      id: "treatmentTarget",
      label: "Tratados vs meta",
      rate: kpis.treatmentTargetRate,
      formatted: formatPercent(kpis.treatmentTargetRate),
    });
  }

  return items;
}

/**
 * Presentation layer over canonical weekly KPIs.
 * Formats fields already calculated by the KPI service — never recomputes rates.
 */
export function buildDashboardView(
  kind: DashboardKind,
  kpis: DashboardKpiSnapshot,
): DashboardView {
  const ctas =
    kind === "team"
      ? teamCtas()
      : { primary: operatorCta(kpis), secondary: [] as DashboardCta[] };

  const operatorsLine =
    kind === "team" &&
    typeof kpis.operatorsTotal === "number" &&
    typeof kpis.operatorsWithQuota === "number"
      ? `Operadores com meta: ${kpis.operatorsWithQuota} de ${kpis.operatorsTotal}`
      : null;

  return {
    kind,
    weekLabel: formatWeekRangePtBr(kpis.period),
    subtitle: kind === "team" ? TEAM_SUBTITLE : OPERATOR_SUBTITLE,
    cards: buildCards(kpis),
    progress: buildProgress(kpis),
    sources: sourceRows(kind, kpis.bySource),
    weekClosedCount:
      kpis.released.weekClosed > 0 ? kpis.released.weekClosed : null,
    empty: emptyState(kind, kpis),
    operatorsLine,
    primaryCta: ctas.primary,
    secondaryCtas: ctas.secondary,
  };
}
