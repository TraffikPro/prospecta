import { Skeleton, Stack, VisuallyHidden } from "@chakra-ui/react";

import { PageFrame, type PageWidth } from "@/components/layout/page-frame";

type PageSkeletonProps = {
  width?: PageWidth;
  /** Approximate blocks under breadcrumbs/heading area. */
  rows?: number;
};

/**
 * Route-level skeleton — matches PageFrame width, leaves shell/nav alone.
 */
export function PageSkeleton({ width = "list", rows = 4 }: PageSkeletonProps) {
  return (
    <PageFrame width={width} gap="6">
      <Stack gap="6" aria-busy="true" aria-live="polite">
        <VisuallyHidden>Carregando conteúdo</VisuallyHidden>
        <Stack gap="3" aria-hidden="true">
          <Skeleton height="14px" width="120px" borderRadius="md" />
          <Skeleton
            height="32px"
            width={{ base: "80%", md: "280px" }}
            borderRadius="md"
          />
          <Skeleton
            height="16px"
            width={{ base: "95%", md: "420px" }}
            borderRadius="md"
          />
        </Stack>
        <Stack gap="3" aria-hidden="true">
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton
              key={index}
              height={width === "detail" ? "88px" : "120px"}
              borderRadius="card"
            />
          ))}
        </Stack>
      </Stack>
    </PageFrame>
  );
}
