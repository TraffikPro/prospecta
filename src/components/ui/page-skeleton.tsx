import { Box, Skeleton, Stack, VisuallyHidden } from "@chakra-ui/react";

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
  const isDetailWide = width === "detailWide";

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
            height="72px"
            width="full"
            borderRadius="card"
          />
        </Stack>

        {isDetailWide ? (
          <Box
            display={{ base: "flex", lg: "grid" }}
            flexDirection="column"
            gridTemplateColumns={{ lg: "minmax(0, 1.65fr) minmax(0, 0.9fr)" }}
            gap={{ base: "6", lg: "8" }}
            alignItems="start"
            aria-hidden="true"
          >
            <Stack gap="3">
              {Array.from({ length: Math.max(rows - 1, 3) }, (_, index) => (
                <Skeleton key={index} height="120px" borderRadius="card" />
              ))}
            </Stack>
            <Stack gap="3" display={{ base: "none", lg: "flex" }}>
              <Skeleton height="140px" borderRadius="card" />
              <Skeleton height="96px" borderRadius="card" />
              <Skeleton height="160px" borderRadius="card" />
            </Stack>
          </Box>
        ) : (
          <Stack gap="3" aria-hidden="true">
            {Array.from({ length: rows }, (_, index) => (
              <Skeleton
                key={index}
                height={width === "detail" ? "88px" : "120px"}
                borderRadius="card"
              />
            ))}
          </Stack>
        )}
      </Stack>
    </PageFrame>
  );
}
