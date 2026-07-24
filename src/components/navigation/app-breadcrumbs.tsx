import { Breadcrumb } from "@chakra-ui/react";
import NextLink from "next/link";
import { Fragment } from "react";

import type { BreadcrumbItemModel } from "./breadcrumb.types";

type AppBreadcrumbsProps = {
  items: BreadcrumbItemModel[];
};

export function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb.Root
      size="sm"
      data-testid="app-breadcrumbs"
      maxW="full"
      overflow="hidden"
    >
      <Breadcrumb.List flexWrap="wrap" gap="1" rowGap="1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? <Breadcrumb.Separator>/</Breadcrumb.Separator> : null}
              <Breadcrumb.Item minH="touch" display="inline-flex" alignItems="center">
                {isLast || !item.href ? (
                  <Breadcrumb.CurrentLink
                    aria-current="page"
                    maxW={{ base: "40", md: "xs" }}
                    truncate
                    title={item.label}
                    data-testid="breadcrumb-current"
                  >
                    {item.label}
                  </Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link asChild maxW={{ base: "40", md: "xs" }} truncate>
                    <NextLink
                      href={item.href}
                      title={item.label}
                      data-testid="breadcrumb-link"
                    >
                      {item.label}
                    </NextLink>
                  </Breadcrumb.Link>
                )}
              </Breadcrumb.Item>
            </Fragment>
          );
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
