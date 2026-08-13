import type { ReactNode } from "react";

import type { NavIconId } from "./nav-config";

type IconProps = {
  size?: number;
};

function SvgIcon({
  size = 20,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function NavIcon({ id, size }: { id: NavIconId } & IconProps) {
  switch (id) {
    case "overview":
      return (
        <SvgIcon size={size}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </SvgIcon>
      );
    case "queue":
      return (
        <SvgIcon size={size}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 9h8M8 12h8M8 15h5" />
        </SvgIcon>
      );
    case "intelligence":
      return (
        <SvgIcon size={size}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <circle cx="12" cy="12" r="4" />
        </SvgIcon>
      );
    case "pipeline":
      return (
        <SvgIcon size={size}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </SvgIcon>
      );
    case "leads":
      return (
        <SvgIcon size={size}>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </SvgIcon>
      );
    case "portfolio":
      return (
        <SvgIcon size={size}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </SvgIcon>
      );
    case "acquisition":
      return (
        <SvgIcon size={size}>
          <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />
        </SvgIcon>
      );
    case "team":
      return (
        <SvgIcon size={size}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19a6 6 0 0 1 12 0" />
          <circle cx="17" cy="9" r="2" />
          <path d="M21 19a4.5 4.5 0 0 0-6-4.2" />
        </SvgIcon>
      );
  }
}

export function CollapseIcon({ expanded }: { expanded: boolean }) {
  return (
    <SvgIcon size={18}>
      {expanded ? (
        <path d="M15 6 9 12l6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </SvgIcon>
  );
}
