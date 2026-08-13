export type NavGroupId = "overview" | "operation" | "commercial" | "management";

export type NavVisibility = "all" | "acquisition" | "admin";

export type NavMatch = "exact" | "prefix";

export type NavIconId =
  | "overview"
  | "queue"
  | "intelligence"
  | "pipeline"
  | "leads"
  | "portfolio"
  | "acquisition"
  | "team";

export type AppNavItem = {
  id: string;
  href: string;
  label: string;
  shortLabel?: string;
  icon: NavIconId;
  group: NavGroupId;
  visibility: NavVisibility;
  match: NavMatch;
  testId?: string;
};

export type NavAccess = {
  role: string;
  canRunAcquisition: boolean;
};

export type NavGroup = {
  id: NavGroupId;
  label: string | null;
  items: AppNavItem[];
};

export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {
    id: "overview",
    href: "/app",
    label: "Visão geral",
    icon: "overview",
    group: "overview",
    visibility: "all",
    match: "exact",
  },
  {
    id: "my-leads",
    href: "/app/my-leads",
    label: "Minha fila",
    shortLabel: "Fila",
    icon: "queue",
    group: "operation",
    visibility: "all",
    match: "prefix",
  },
  {
    id: "intelligence",
    href: "/app/intelligence",
    label: "Inteligência",
    icon: "intelligence",
    group: "operation",
    visibility: "all",
    match: "prefix",
  },
  {
    id: "pipeline",
    href: "/app/pipeline",
    label: "Pipeline",
    icon: "pipeline",
    group: "operation",
    visibility: "all",
    match: "prefix",
  },
  {
    id: "leads",
    href: "/app/leads",
    label: "Leads",
    icon: "leads",
    group: "commercial",
    visibility: "all",
    match: "prefix",
  },
  {
    id: "portfolio",
    href: "/app/portfolio",
    label: "Portfólio",
    icon: "portfolio",
    group: "commercial",
    visibility: "all",
    match: "prefix",
  },
  {
    id: "acquisition",
    href: "/admin/acquisition",
    label: "Aquisição",
    icon: "acquisition",
    group: "management",
    visibility: "acquisition",
    match: "prefix",
    testId: "nav-acquisition",
  },
  {
    id: "team",
    href: "/admin/users",
    label: "Equipe",
    icon: "team",
    group: "management",
    visibility: "admin",
    match: "prefix",
    testId: "nav-admin-users",
  },
] as const;

const GROUP_META: { id: NavGroupId; label: string | null }[] = [
  { id: "overview", label: null },
  { id: "operation", label: "Operação" },
  { id: "commercial", label: "Base comercial" },
  { id: "management", label: "Gestão" },
];

export const MOBILE_PRIMARY_NAV = [
  {
    href: "/app/my-leads",
    label: "Fila",
    testId: "mobile-nav-my-leads",
  },
  {
    href: "/app/intelligence",
    label: "Inteligência",
    testId: "mobile-nav-intelligence",
  },
  {
    href: "/app/pipeline",
    label: "Pipeline",
    testId: "mobile-nav-pipeline",
  },
  {
    href: "/app/more",
    label: "Mais",
    testId: "mobile-nav-more",
  },
] as const;

export const profileRoleLabels: Record<"ADMIN" | "MEMBER", string> = {
  ADMIN: "Administrador",
  MEMBER: "Membro",
};

const MORE_GENERAL_IDS = new Set(["overview", "leads", "portfolio"]);
const MORE_MANAGEMENT_IDS = new Set(["acquisition", "team"]);

export function canSeeNavItem(item: AppNavItem, access: NavAccess): boolean {
  if (item.visibility === "all") {
    return true;
  }
  if (item.visibility === "admin") {
    return access.role === "ADMIN";
  }
  return (
    access.role === "ADMIN" ||
    (access.role === "MEMBER" && access.canRunAcquisition)
  );
}

export function isNavPathActive(
  pathname: string,
  href: string,
  match: NavMatch = "prefix",
): boolean {
  if (match === "exact") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function withAcquisitionGroup(
  item: AppNavItem,
  access: NavAccess,
): AppNavItem {
  if (item.id === "acquisition" && access.role === "MEMBER") {
    return { ...item, group: "commercial" };
  }
  return item;
}

export function visibleNavItems(access: NavAccess): AppNavItem[] {
  return APP_NAV_ITEMS.filter((item) => canSeeNavItem(item, access)).map(
    (item) => withAcquisitionGroup(item, access),
  );
}

export function visibleNavGroups(access: NavAccess): NavGroup[] {
  const items = visibleNavItems(access);
  return GROUP_META.map((group) => ({
    ...group,
    items: items.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);
}

export function morePageSections(access: NavAccess): NavGroup[] {
  const items = visibleNavItems(access);
  const sections: NavGroup[] = [
    {
      id: "overview",
      label: "Geral",
      items: items.filter((item) => MORE_GENERAL_IDS.has(item.id)),
    },
    {
      id: "management",
      label: "Gestão",
      items: items.filter((item) => MORE_MANAGEMENT_IDS.has(item.id)),
    },
  ];
  return sections.filter((group) => group.items.length > 0);
}

export function profileRoleLabel(role: string): string {
  if (role === "ADMIN" || role === "MEMBER") {
    return profileRoleLabels[role];
  }
  return role;
}
