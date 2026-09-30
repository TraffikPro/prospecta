"use client";

import {
  Button as ChakraButton,
  type ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";

export type ButtonProps = ChakraButtonProps;

/** Primary action control — brand palette + control radius by default. */
export function Button({
  colorPalette = "brand",
  borderRadius = "control",
  ...props
}: ButtonProps) {
  return (
    <ChakraButton
      colorPalette={colorPalette}
      borderRadius={borderRadius}
      {...props}
    />
  );
}
