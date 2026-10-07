"use client";

import {
  Button as ChakraButton,
  type ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";
import { forwardRef } from "react";

export type ButtonProps = ChakraButtonProps;

/** Primary action control — brand palette by default. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { colorPalette = "brand", borderRadius = "button", ...props },
    ref,
  ) {
    return (
      <ChakraButton
        ref={ref}
        colorPalette={colorPalette}
        borderRadius={borderRadius}
        {...props}
      />
    );
  },
);
