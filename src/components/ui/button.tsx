"use client";

import {
  Button as ChakraButton,
  type ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";

export type ButtonProps = ChakraButtonProps;

/** Primary action control — brand palette by default. */
export function Button({ colorPalette = "brand", borderRadius = "button", ...props }: ButtonProps) {
  return (
    <ChakraButton colorPalette={colorPalette} borderRadius={borderRadius} {...props} />
  );
}
