import { Box, Skeleton, Stack, VisuallyHidden } from "@chakra-ui/react";

import { PageFrame, type PageWidth } from "@/components/layout/page-frame";

type PageSkeletonProps = {
  width?: PageWidth;
  /** Approximate blocks under breadcrumbs/heading area. */
  rows?: number;
  /** `queue` approximates row-first work surfaces (F4 Minha fila). */
  density?: "default" | "queue";
};

/**
 * Route-level skeleton — matches PageFrame width, leaves shell/nav alone.
 */
export function PageSkeleton({
  width = "list",
  rows = 4,
  density = "default",
}: PageSkeletonProps) {
  const isDetailWide = width === "detailWide";
  const isQueue = density === "queue";
  const rowHeight = isQueue ? "64px" : width === "detail" ? "88px" : "120px";

  return (
    <PageFrame width={width} gap={isQueue ? "5" : "6"}>
      <Stack gap={isQueue ? "5" : "6"} aria-busy="true" aria-live="polite">
        <VisuallyHidden>Carregando conteúdo</VisuallyHidden>
        <Stack gap="3" aria-hidden="true">
          <Skeleton height="14px" width="120px" borderRadius="control" />
          <Skeleton
            height="32px"
            width={{ base: "80%", md: "280px" }}
            borderRadius="control"
          />
          <Skeleton
            height={isQueue ? "48px" : "72px"}
            width="full"
            borderRadius="surface"
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
                <Skeleton key={index} height="120px" borderRadius="surface" />
              ))}
            </Stack>
            <Stack gap="3" display={{ base: "none", lg: "flex" }}>
              <Skeleton height="140px" borderRadius="surface" />
              <Skeleton height="96px" borderRadius="surface" />
              <Skeleton height="160px" borderRadius="surface" />
            </Stack>
          </Box>
        ) : (
          <Stack gap={isQueue ? "2" : "3"} aria-hidden="true">
            {Array.from({ length: rows }, (_, index) => (
              <Skeleton
                key={index}
                height={rowHeight}
                borderRadius="surface"
              />
            ))}
          </Stack>
        )}
      </Stack>
    </PageFrame>
  );
}
