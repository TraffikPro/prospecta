import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * Prospecta design tokens (Chakra UI v3).
 * Brand: teal/slate — B2B CRM, not purple defaults.
 */
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#f0fdfa" },
          100: { value: "#ccfbf1" },
          200: { value: "#99f6e4" },
          300: { value: "#5eead4" },
          400: { value: "#2dd4bf" },
          500: { value: "#14b8a6" },
          600: { value: "#0d9488" },
          700: { value: "#0f766e" },
          800: { value: "#115e59" },
          900: { value: "#134e4a" },
          950: { value: "#042f2e" },
        },
        success: {
          50: { value: "#f0fdf4" },
          100: { value: "#dcfce7" },
          200: { value: "#bbf7d0" },
          300: { value: "#86efac" },
          400: { value: "#4ade80" },
          500: { value: "#22c55e" },
          600: { value: "#16a34a" },
          700: { value: "#15803d" },
          800: { value: "#166534" },
          900: { value: "#14532d" },
          950: { value: "#052e16" },
        },
        warning: {
          50: { value: "#fffbeb" },
          100: { value: "#fef3c7" },
          200: { value: "#fde68a" },
          300: { value: "#fcd34d" },
          400: { value: "#fbbf24" },
          500: { value: "#f59e0b" },
          600: { value: "#d97706" },
          700: { value: "#b45309" },
          800: { value: "#92400e" },
          900: { value: "#78350f" },
          950: { value: "#451a03" },
        },
        danger: {
          50: { value: "#fef2f2" },
          100: { value: "#fee2e2" },
          200: { value: "#fecaca" },
          300: { value: "#fca5a5" },
          400: { value: "#f87171" },
          500: { value: "#ef4444" },
          600: { value: "#dc2626" },
          700: { value: "#b91c1c" },
          800: { value: "#991b1b" },
          900: { value: "#7f1d1d" },
          950: { value: "#450a0a" },
        },
      },
      spacing: {
        sm: { value: "0.5rem" },
        md: { value: "1rem" },
        lg: { value: "1.5rem" },
      },
      radii: {
        card: { value: "0.75rem" },
        button: { value: "0.375rem" },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.600}" },
          contrast: { value: "white" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.50}" },
          emphasized: { value: "{colors.brand.200}" },
          focusRing: { value: "{colors.brand.500}" },
        },
        success: {
          solid: { value: "{colors.success.600}" },
          contrast: { value: "white" },
          fg: { value: "{colors.success.700}" },
          muted: { value: "{colors.success.100}" },
          subtle: { value: "{colors.success.50}" },
          emphasized: { value: "{colors.success.200}" },
          focusRing: { value: "{colors.success.500}" },
        },
        warning: {
          solid: { value: "{colors.warning.500}" },
          contrast: { value: "{colors.warning.950}" },
          fg: { value: "{colors.warning.700}" },
          muted: { value: "{colors.warning.100}" },
          subtle: { value: "{colors.warning.50}" },
          emphasized: { value: "{colors.warning.200}" },
          focusRing: { value: "{colors.warning.500}" },
        },
        danger: {
          solid: { value: "{colors.danger.600}" },
          contrast: { value: "white" },
          fg: { value: "{colors.danger.700}" },
          muted: { value: "{colors.danger.100}" },
          subtle: { value: "{colors.danger.50}" },
          emphasized: { value: "{colors.danger.200}" },
          focusRing: { value: "{colors.danger.500}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
