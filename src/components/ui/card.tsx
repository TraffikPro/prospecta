"use client";

import type { ComponentProps } from "react";

import { Card as ChakraCard } from "@chakra-ui/react";

export type CardRootProps = ComponentProps<typeof ChakraCard.Root>;

/**
 * Prospecta card surface — outline + surface radius by default.
 * Use for entities / bounded interactive groups / independent panels.
 * Prefer Stack + border for ordinary sections (see F2 card policy).
 */
export function AppCard({
  borderRadius = "surface",
  variant = "outline",
  ...props
}: CardRootProps) {
  return (
    <ChakraCard.Root borderRadius={borderRadius} variant={variant} {...props} />
  );
}

/**
 * Compound card API. `Root` applies Prospecta surface defaults (AppCard).
 * Explicit `borderRadius="card"` at call sites remains valid (alias of surface).
 */
export const Card = {
  Root: AppCard,
  Header: ChakraCard.Header,
  Body: ChakraCard.Body,
  Footer: ChakraCard.Footer,
  Title: ChakraCard.Title,
  Description: ChakraCard.Description,
};
