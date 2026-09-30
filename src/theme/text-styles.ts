import { defineTextStyles } from "@chakra-ui/react";

/**
 * Visual Foundation — operational typography hierarchy (F2).
 * Prefer these over ad-hoc fontSize in authenticated product UI.
 */
export const textStyles = defineTextStyles({
  pageTitle: {
    description: "H1 — page title",
    value: {
      fontSize: "1.5rem",
      fontWeight: "600",
      lineHeight: "1.25",
      letterSpacing: "-0.02em",
    },
  },
  sectionTitle: {
    description: "H2 — section title",
    value: {
      fontSize: "1.125rem",
      fontWeight: "600",
      lineHeight: "1.35",
    },
  },
  body: {
    description: "Primary operational body copy",
    value: {
      fontSize: "0.875rem",
      fontWeight: "400",
      lineHeight: "1.45",
    },
  },
  data: {
    description: "Dense table / list / form field content",
    value: {
      fontSize: "0.875rem",
      fontWeight: "400",
      lineHeight: "1.35",
    },
  },
  meta: {
    description: "Supporting metadata under titles",
    value: {
      fontSize: "0.875rem",
      fontWeight: "400",
      lineHeight: "1.4",
      color: "fg.muted",
    },
  },
});
