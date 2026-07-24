import type { ReactNode } from "react";

import { Stack, type StackProps } from "@chakra-ui/react";

export type PageWidth = "form" | "detail" | "list";

const MAX_W: Record<PageWidth, StackProps["maxW"]> = {
  form: "containerForm",
  detail: "containerDetail",
  list: "containerList",
};

type PageFrameProps = {
  width?: PageWidth;
  children: ReactNode;
  gap?: StackProps["gap"];
};

/**
 * Responsive content width by screen type (Visual Foundation v1).
 * form 720 · detail 960 · list/pipeline 1200.
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
