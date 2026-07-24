import { Box, Stack } from "@chakra-ui/react";

import { AppBreadcrumbs } from "./app-breadcrumbs";
import type { BreadcrumbItemModel } from "./breadcrumb.types";
import { MobileContextBack } from "./mobile-context-back";

type ContextualNavProps = {
  items: BreadcrumbItemModel[];
};

/**
 * Desktop/tablet: full breadcrumb trail.
 * Mobile: compact back to the immediate parent (bottom nav stays primary).
 */
export function ContextualNav({ items }: ContextualNavProps) {
  if (items.length === 0) {
    return null;
  }

  let back: BreadcrumbItemModel | undefined;
  for (let i = items.length - 2; i >= 0; i -= 1) {
    if (items[i]?.href) {
      back = items[i];
      break;
    }
  }

  return (
    <Stack gap="0" data-testid="contextual-nav">
      <Box display={{ base: "none", md: "block" }}>
        <AppBreadcrumbs items={items} />
      </Box>
      {back?.href ? (
        <Box display={{ base: "block", md: "none" }}>
          <MobileContextBack href={back.href} label={back.label} />
        </Box>
      ) : null}
    </Stack>
  );
}
