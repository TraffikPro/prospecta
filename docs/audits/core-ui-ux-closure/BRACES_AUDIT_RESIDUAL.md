# Residual Dependency Audit — `braces` (GHSA-vfj7-8cjw-p6xm)

**Date consulted:** 2026-10-06 (America/Sao_Paulo)  
**Resolution applied:** 2026-10-07 — cherry-pick from [PR #85](https://github.com/TraffikPro/prospecta/pull/85)  
**Branch / HEAD:** `feat/prospecta-core-ui-ux` (see latest commit)  
**CI command:** `pnpm audit --audit-level high` (pnpm **9.15.9**, Node **22.21.1**)  
**PR:** https://github.com/TraffikPro/prospecta/pull/83  

## Resolution (2026-10-07)

The residual high finding was removed **without** ignoring the advisory and **without** adopting a third-party `braces` fork.

| Item | Detail |
| --- | --- |
| Mechanism | Local MIT shim `tooling/fast-glob-shim` (Node `fs.globSync`) |
| Wiring | `pnpm.overrides["fast-glob"] = "link:tooling/fast-glob-shim"` |
| Call site preserved | `@next/eslint-plugin-next` → `get-root-dirs.js` → `globSync(..., { onlyDirectories: true })` |
| Coverage | ESLint rule equivalence proven in `docs/audits/eslint-braces-alternative/` (PR #85) |
| Graph | `pnpm why braces` → empty; audit high/critical → clean |

## Historical finding (pre-fix)

| Item | Evidence |
| --- | --- |
| Advisory | https://github.com/advisories/GHSA-vfj7-8cjw-p6xm |
| Package | `braces@3.0.3` via `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` |
| Official patched release | none at investigation time |
| Rejected | `@dieub/*` override, audit weaken/ignore, dropping `eslint-config-next` |

Full investigation: `docs/audits/eslint-braces-alternative/REPORT.md`.

## Status

- Dependency audit residual for `braces`: **resolved** on this branch after #85 cherry-pick.  
- Ready-for-review remains a **human** decision after CI re-check on the updated SHA.
