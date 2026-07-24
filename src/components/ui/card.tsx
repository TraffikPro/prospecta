"use client";

import type { ComponentProps } from "react";

import { Card as ChakraCard } from "@chakra-ui/react";

export const Card = {
  Root: ChakraCard.Root,
  Header: ChakraCard.Header,
  Body: ChakraCard.Body,
  Footer: ChakraCard.Footer,
  Title: ChakraCard.Title,
  Description: ChakraCard.Description,
};

export type CardRootProps = ComponentProps<typeof ChakraCard.Root>;

/** Card with Prospecta radius token. */
export function AppCard({ borderRadius = "card", variant = "outline", ...props }: CardRootProps) {
  return <ChakraCard.Root borderRadius={borderRadius} variant={variant} {...props} />;
}
