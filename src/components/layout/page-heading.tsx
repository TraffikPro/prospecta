import type { ReactNode } from "react";

import { Heading, Stack, Text } from "@chakra-ui/react";

type PageHeadingProps = {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
};

/** Consistent H1 + optional meta row for authenticated pages. */
export function PageHeading({ title, meta, actions }: PageHeadingProps) {
  return (
    <Stack
      direction={{ base: "column", md: actions ? "row" : "column" }}
      justify="space-between"
      align={{ base: "stretch", md: actions ? "center" : "stretch" }}
      gap="3"
    >
      <Stack gap="1" minW="0">
        <Heading as="h1" textStyle="pageTitle">
          {title}
        </Heading>
        {meta ? <Text textStyle="meta">{meta}</Text> : null}
      </Stack>
      {actions}
    </Stack>
  );
}

type SectionHeadingProps = {
  children: ReactNode;
  id?: string;
};

export function SectionHeading({ children, id }: SectionHeadingProps) {
  return (
    <Heading as="h2" id={id} textStyle="sectionTitle">
      {children}
    </Heading>
  );
}
