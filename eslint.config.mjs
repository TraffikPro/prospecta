import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Intentional rule-violation fixtures for braces/lint equivalence proofs:
    "docs/audits/eslint-braces-alternative/fixtures/**",
    // Local CJS shim (Node require API); not app TypeScript:
    "tooling/fast-glob-shim/**",
  ]),
]);

export default eslintConfig;
