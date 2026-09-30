"use client";

import type { ComponentProps } from "react";

import { Table as ChakraTable } from "@chakra-ui/react";

export type TableRootProps = ComponentProps<typeof ChakraTable.Root>;

/**
 * Operational data table defaults: compact + outline (border > shadow).
 * Column/layout decisions stay in feature tables — this only normalizes chrome.
 */
export function AppTableRoot({
  size = "sm",
  variant = "outline",
  ...props
}: TableRootProps) {
  return <ChakraTable.Root size={size} variant={variant} {...props} />;
}

export const Table = {
  Root: AppTableRoot,
  Header: ChakraTable.Header,
  Body: ChakraTable.Body,
  Row: ChakraTable.Row,
  ColumnHeader: ChakraTable.ColumnHeader,
  Cell: ChakraTable.Cell,
  Caption: ChakraTable.Caption,
  Footer: ChakraTable.Footer,
  ScrollArea: ChakraTable.ScrollArea,
};
