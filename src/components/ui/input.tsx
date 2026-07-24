"use client";

import {
  Input as ChakraInput,
  type InputProps as ChakraInputProps,
} from "@chakra-ui/react";

export type InputProps = ChakraInputProps;

export function Input({ borderRadius = "button", ...props }: InputProps) {
  return <ChakraInput borderRadius={borderRadius} {...props} />;
}
