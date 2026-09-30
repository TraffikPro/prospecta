"use client";

import {
  Input as ChakraInput,
  type InputProps as ChakraInputProps,
} from "@chakra-ui/react";

export type InputProps = ChakraInputProps;

/** Form control — control radius by default (matches Button). */
export function Input({ borderRadius = "control", ...props }: InputProps) {
  return <ChakraInput borderRadius={borderRadius} {...props} />;
}
