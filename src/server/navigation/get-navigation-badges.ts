import { cache } from "react";

import {
  getNavigationBadges as loadNavigationBadges,
  type NavigationBadges,
} from "@/server/services/navigation-badges.service";

/** Dedupes layout + More page in the same request. */
export const getNavigationBadgesCached = cache(loadNavigationBadges);

export const EMPTY_NAV_BADGES: NavigationBadges = { myQueue: 0 };

export type { NavigationBadges };
