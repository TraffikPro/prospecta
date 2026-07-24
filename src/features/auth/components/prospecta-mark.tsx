import { Box, type BoxProps } from "@chakra-ui/react";

type ProspectaMarkProps = {
  size?: number;
  /** Light mark for dark brand surfaces. */
  light?: boolean;
} & Omit<BoxProps, "children">;

/** Inline brand mark SVG — no external assets. */
export function ProspectaMark({
  size = 36,
  light = false,
  ...boxProps
}: ProspectaMarkProps) {
  const plate = light ? "rgba(255, 255, 255, 0.15)" : "#0d9488"; // brand.600
  const accent = "rgba(255, 255, 255, 0.7)";

  return (
    <Box
      as="span"
      display="inline-flex"
      flexShrink={0}
      lineHeight={0}
      {...boxProps}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden
      >
        <rect width="36" height="36" rx="9" fill={plate} />
        <path
          d="M11 26V10H18.5C21.538 10 24 12.462 24 15.5C24 18.538 21.538 21 18.5 21H11"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 24L23 21L26 24"
          stroke={accent}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}
