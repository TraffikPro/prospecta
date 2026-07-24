import type { ReactNode } from "react";

import { Stack, type StackProps } from "@chakra-ui/react";

export type PageWidth = "form" | "detail" | "detailWide" | "list";

const MAX_W: Record<PageWidth, StackProps["maxW"]> = {
  form: "containerForm",
  detail: "containerDetail",
  detailWide: "containerDetailWide",
  list: "containerList",
};

type PageFrameProps = {
  width?: PageWidth;
  children: ReactNode;
  gap?: StackProps["gap"];
};

/**
 * Responsive content width by screen type (Visual Foundation v1).
 * form 720 · detail 960 · detailWide 1200 · list/pipeline 1200.
 */
export function PageFrame({
  width = "list",
  children,
  gap = "6",
}: PageFrameProps) {
  return (
    <Stack
      gap={gap}
      w="full"
      maxW={MAX_W[width]}
      mx="auto"
      data-page-width={width}
    >
      {children}
    </Stack>
  );
}
