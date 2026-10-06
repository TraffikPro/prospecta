# ESLint braces alternative — investigation & fix

**Branch:** `fix/eslint-remove-vulnerable-braces`  
**Base:** `main` @ `b9194c4` (not PR #83 UI)  
**Related:** [PR #83](https://github.com/TraffikPro/prospecta/pull/83) residual `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm)

## 1. Base chosen

| Option | Result |
| --- | --- |
| Branch from PR #83 | Rejected for this PR — would mix CORE UI/UX with lint fix |
| Branch from `main` only | Insufficient alone — `main` still has Next `16.3.3` (critical) + unpatched brace-expansion/sharp/source-map-js |
| **`main` + dep commit from #83 (`9d9e941`) + local shim** | Selected |

Transported from #83 **only** dependency security pins (Next/`eslint-config-next` `16.3.8`, `brace-expansion`, `sharp`, `source-map-js`). No UI/domain commits.

Relationship: this PR clears the **braces** residual that kept #83 draft after `9d9e941`. After merge (or cherry-pick into #83), rebase #83 onto the fix and re-run `pnpm audit --audit-level high`.

## 2. Coupling that introduces braces

```
eslint-config-next
  → @next/eslint-plugin-next
    → fast-glob@3.3.1
      → micromatch
        → braces@3.0.3  (GHSA-vfj7-8cjw-p6xm, no official patch)
```

Sole call site in the plugin:

- `dist/utils/get-root-dirs.js` → `fast-glob.globSync(pattern, { onlyDirectories: true })`
- Consumed by `@next/next/no-html-link-for-pages` (and any rule that resolves page roots)

Runtime / production install does **not** include this chain; it is **dev/lint** only. Full `pnpm audit` still sees it.

## 3. Alternatives evaluated

| Alternative | Verdict |
| --- | --- |
| Wait for official `braces` patch | No patched release (reconfirmed) |
| Upgrade Next past 16.3.8 hoping fast-glob drops | Next still pins `fast-glob@3.3.1` |
| Drop `eslint-config-next` | Loses Next rules / import resolver stack — out of scope |
| Hand-roll full ESLint plugins without Next config | Large maintenance; not “smallest alternative” |
| Third-party forks (e.g. `@dieub/*`) | Rejected — unknown supply chain |
| `pnpm.overrides` to patched braces | No official patched braces |
| **Local MIT `tooling/fast-glob-shim` + `pnpm.overrides["fast-glob"]=link:...`** | Adopted |

Shim uses Node.js `fs.globSync` (Node ≥ 22, matches CI `22.21.1`). Not a rename of vulnerable code.

## 4. Equivalence matrix (before → after)

Source: local `eslint --print-config` dumps (gitignored; regenerable) summarized in `baseline/SUMMARY.json` and compared in `EQUIVALENCE.json`.

| File class | Rule count | Severity diffs | Parser/plugins |
| --- | --- | --- | --- |
| App Router page | equal | **0** | unchanged |
| Client form | equal | **0** | unchanged |
| Server page | equal | **0** | unchanged |
| Server service | equal | **0** | unchanged |
| Unit test | equal | **0** | unchanged |
| Script | equal | **0** | unchanged |

`eslint.config.mjs` still spreads `eslint-config-next/core-web-vitals` + `typescript`. Extra `globalIgnores` only for:

- intentional fixtures under `docs/audits/eslint-braces-alternative/fixtures/**`
- the CJS shim under `tooling/fast-glob-shim/**`

Product/source coverage is unchanged.

## 5. Fixtures & checks

Fixtures (`--no-ignore`) still fire:

| Fixture | Rules hit |
| --- | --- |
| `bad-hooks.tsx` | `react-hooks/rules-of-hooks`, `react-hooks/purity` |
| `bad-exhaustive-deps.tsx` | `react-hooks/exhaustive-deps` (+ `set-state-in-effect`) |
| `bad-html-link.tsx` | `@next/next/no-html-link-for-pages` (**exercises get-root-dirs / shim**) |
| `bad-unused.ts` | `@typescript-eslint/no-unused-vars` |

Validations (local worktree, Node 22.21.1, pnpm 9.15.9):

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | pass |
| `pnpm audit --audit-level high` | pass (2 moderate remain; 0 high/critical) |
| `pnpm why braces` | empty (package absent) |
| `pnpm lint` | pass (pre-existing warning in smoke script only) |
| `pnpm typecheck` | pass |
| `pnpm test` (local Postgres `127.0.0.1:5433`) | pass (349) |
| `pnpm build` | pass (Next 16.3.8) |
| CORE E2E | not required — no runtime dependency change beyond Next patch already in #83 deps |

## 6. Final dependency graph (lint path)

```
eslint-config-next@16.3.8
  └─ @next/eslint-plugin-next@16.3.8
       └─ fast-glob → link:tooling/fast-glob-shim   (no micromatch, no braces)
```

## 7. Maintenance cost

- **Size:** ~80 LOC CJS + package metadata / MIT license / README
- **Risk:** API surface limited to what `get-root-dirs` calls; unit tests in `src/lib/fast-glob-shim.test.ts`
- **Trigger to revisit:** Next releases dropping `fast-glob` or shipping a braces-free tree → remove override + shim
- **Not a third-party fork** of braces/micromatch

## 8. Publication

- **SHA:** `8818003b34185a1797c9e32d2436f81a4ac17361`
- **PR (draft):** https://github.com/TraffikPro/prospecta/pull/85
- **Branch:** `fix/eslint-remove-vulnerable-braces`
- PR #83 left untouched (still draft).

## 9. Next action to unblock #83

1. Merge or land this lint PR (or cherry-pick onto `feat/prospecta-core-ui-ux`).
2. Rebase #83; drop duplicate dep pins if already present.
3. Confirm `pnpm audit --audit-level high` clean on #83 SHA.
4. Only then consider marking #83 ready (separate human decision).

**Environment:** local worktree `prospecta-eslint-braces`; Postgres local `5433`; no production mutation; no deploy; #83 branch untouched.
