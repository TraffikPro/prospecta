"use client";

import { ThemeProvider, type ThemeProviderProps } from "next-themes";

export type ColorModeProviderProps = ThemeProviderProps;

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      defaultTheme="light"
      enableSystem={false}
      {...props}
    />
  );
}
