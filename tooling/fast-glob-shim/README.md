# fast-glob-shim (Prospecta)

MIT-licensed **local** CommonJS shim of the `fast-glob` API surface used by
`@next/eslint-plugin-next` (`globSync` + `onlyDirectories`).

## Purpose

Remove the npm chain `fast-glob → micromatch → braces@3.0.3`
([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm))
from Prospecta's ESLint dependency graph without dropping `eslint-config-next`.

## Scope

Implements only what `get-root-dirs.js` calls. Not a general-purpose fast-glob
replacement. Requires **Node.js >= 22** (`fs.globSync`), matching CI
(`NODE_VERSION: 22.21.1`).

## Wiring

`package.json` → `pnpm.overrides["fast-glob"] = "link:tooling/fast-glob-shim"`.
