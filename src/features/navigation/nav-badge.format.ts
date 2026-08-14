const BADGE_COUNT_CAP = 99;

/** Visual cap for nav badges. The raw count stays numeric in the contract. */
export function formatBadgeCount(count: number): string {
  if (count <= 0) {
    return "";
  }
  if (count > BADGE_COUNT_CAP) {
    return `${BADGE_COUNT_CAP}+`;
  }
  return String(count);
}

export function navItemAccessibleName(
  label: string,
  itemId: string,
  count: number,
): string {
  if (count <= 0) {
    return label;
  }
  if (itemId === "my-leads") {
    return `${label}, ${count} ${count === 1 ? "pendência" : "pendências"}`;
  }
  if (itemId === "high-pool") {
    return `${label}, ${count} ${count === 1 ? "reciclável" : "recicláveis"}`;
  }
  return `${label}, ${count}`;
}

export function badgeCountForNavItem(
  itemId: string,
  badges: { myQueue: number; highReview?: number },
): number {
  if (itemId === "my-leads") {
    return badges.myQueue;
  }
  if (itemId === "high-pool") {
    return badges.highReview ?? 0;
  }
  return 0;
}

export function navBadgeTone(
  itemId: string,
): "brand" | "warning" {
  return itemId === "high-pool" ? "warning" : "brand";
}
