import { Badge } from "@chakra-ui/react";

import {
  formatBadgeCount,
  navBadgeTone,
} from "@/features/navigation/nav-badge.format";

type NavBadgeProps = {
  count: number;
  itemId: string;
  compact?: boolean;
};

export function NavBadge({ count, itemId, compact = false }: NavBadgeProps) {
  const label = formatBadgeCount(count);
  if (!label) {
    return null;
  }

  return (
    <Badge
      colorPalette={navBadgeTone(itemId)}
      variant="subtle"
      size="sm"
      fontSize={compact ? "2xs" : "xs"}
      fontWeight="semibold"
      fontVariantNumeric="tabular-nums"
      minW="4"
      px={compact ? "0.5" : "1"}
      lineHeight="1.2"
      textAlign="center"
      aria-hidden="true"
      data-testid={`nav-badge-${itemId}`}
    >
      {label}
    </Badge>
  );
}
