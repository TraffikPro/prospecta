# F1 Implementation Report

**Phase:** Product UI v2 — Clarity & Correctness  
**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Source of truth:** `docs/audits/PROSPECTA_PRODUCT_UI_AUDIT.md`

---

## Scope

Implemented **only** F1:

| Item | Outcome |
|------|---------|
| A — Portfólio / Carteira semantic collision | Done (user-facing labels) |
| B — `/app/leads` empty-state correctness | Verified; **no change** (already correct in HEAD) |
| C — Aquisição nav vs ADMIN gate | Done |

No F2+ work (density, design tokens, pipeline, auth visual, etc.).

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/navigation/nav-config.ts` | Label `Portfólio` → `Demos`; acquisition `visibility: "admin"`; removed `acquisition` visibility + MEMBER remap |
| `src/components/navigation/nav-config.test.ts` | Expect MEMBER+`canRunAcquisition` **not** to see Aquisição |
| `src/app/(authenticated)/app/portfolio/page.tsx` | Breadcrumb/title → `Demos` / `Demos comerciais` |
| `e2e/portfolio.spec.ts` | Assert new headings/link labels |
| `docs/audits/PROSPECTA_PRODUCT_UI_AUDIT.md` | F1 status section |
| `docs/audits/PROSPECTA_PRODUCT_UI_F1_REPORT.md` | This report |

**Unrelated left untouched:** `docs/product/assets/social-preview/` (pre-existing untracked).

---

## Portfólio/Carteira Decision

### Classification (pre-change)

| Occurrence | Class | Action |
|------------|-------|--------|
| Nav label `Portfólio` | USER-FACING LABEL | → **Demos** |
| Page title `Portfólio comercial` | USER-FACING LABEL | → **Demos comerciais** |
| Breadcrumb `Portfólio` | USER-FACING LABEL | → **Demos** |
| `PORTFOLIO_DISCLAIMER` / “modelo demonstrativo” | USER-FACING LABEL | KEEP (already clear) |
| Banner **Carteira semanal** / Completar carteira | USER-FACING LABEL | KEEP |
| Dashboard “carteira” copy | USER-FACING LABEL | KEEP |
| Route `/app/portfolio` | API / route contract | KEEP |
| `id: "portfolio"`, icon id, feature folder `features/portfolio` | INTERNAL | KEEP |
| Prisma `WeeklyPortfolio`, `portfolioId` | DATABASE / DOMAIN MODEL | KEEP |
| `getPortfolioSummaryForUser`, `PortfolioError`, etc. | INTERNAL / DOMAIN | KEEP |
| Static demo HTML under `/portfolio/...` | PUBLIC ASSET PATH | KEEP |

### Product vocabulary (user-facing)

| Concept | User-facing term |
|---------|------------------|
| Demo / showcase sites-conceito | **Demos** (nav), **Demos comerciais** (page) |
| Weekly lead allocation / ownership | **Carteira** / **Carteira semanal** (unchanged) |

Demos cannot be confused with operational lead ownership after this change.

---

## Internal Naming Intentionally Preserved

- URL `/app/portfolio`
- Nav item `id: "portfolio"`, icon `"portfolio"`
- Feature module `src/features/portfolio/**` (shared folder also hosts wallet/high-pool UI — known internal debt, **not** renamed in F1)
- Prisma `WeeklyPortfolio`, assignment `portfolioId`
- Services/actions named `portfolio.*`
- `data-testid` prefixes `portfolio-*`
- Public demo asset paths `/portfolio/...`

**Debt note for later (not F1):** the feature folder name `portfolio` still covers both demos and carteira domain helpers; renaming would be a large move with no user benefit in F1.

---

## Leads Correctness Fix

### Audit claim

`/app/leads` empty state uses `<Text>` without importing `Text` (imports `Box` instead).

### Verification (contradicts audit for current HEAD)

```text
git show HEAD:"src/app/(authenticated)/app/leads/page.tsx"
→ import { Text } from "@chakra-ui/react";
→ empty: <Text textStyle="meta">Nenhum lead cadastrado</Text>
```

**Bug not present** on this branch HEAD. No code change applied for F1-B.

`LeadTable` also guards empty with its own muted text. Page empty branch is reachable and typechecks.

### Acceptance

| Criterion | Result |
|-----------|--------|
| Renders with data | Unchanged; table path intact |
| Renders with zero leads | Empty `Text` with valid import |
| Empty does not throw | Confirmed via typecheck + import present |
| No redesign | No columns/filters/search added |

---

## Aquisição Authorization/Nav Alignment

### Authorization source of truth (unchanged)

| Layer | Behavior |
|-------|----------|
| Role | `SessionUser.role` (`ADMIN` \| `MEMBER`) via session |
| Page | `src/app/(authenticated)/admin/acquisition/page.tsx` → `requireRole(sessionUser, "ADMIN")` → `forbidden()` for non-ADMIN |
| Action | `src/server/actions/acquisition.ts` → `requireRole(..., "ADMIN")` |
| Schema comment | FREE_PULL UI is ADMIN-only; MEMBER uses wallet fill (`canRunAcquisition`) |

### Nav change

**Before:** `visibility: "acquisition"` → ADMIN **or** MEMBER with `canRunAcquisition` (MEMBER item remapped to commercial group).

**After:** `visibility: "admin"` → **ADMIN only**. Removed dead `NavVisibility` `"acquisition"` and `withAcquisitionGroup`.

`canRunAcquisition` remains on `NavAccess` / session / Equipe UI — still gates **carteira** eligibility, not FREE_PULL nav.

### Invariant

| Actor | Sees Aquisição in nav | Direct `/admin/acquisition` |
|-------|----------------------|------------------------------|
| ADMIN | Yes | Allowed |
| MEMBER (any `canRunAcquisition`) | No | `forbidden()` (server) |

Hiding nav is **not** authorization; server gate remains authoritative.

---

## Tests

Commands (npm; `pnpm` unavailable in shell PATH):

| Command | Result |
|---------|--------|
| `npm run typecheck` | Pass (`tsc --noEmit`) |
| `npm run lint` | Pass (0 errors; 1 pre-existing warning in `scripts/smoke-breadcrumbs-prod.mjs`) |
| `npx --no-install tsx --test --test-concurrency=1 src/components/navigation/nav-config.test.ts` | Pass (8/8) |
| `npm run build` | Pass (Next.js 16.3.3) |

E2E not executed in this environment (requires running app + seed credentials). Specs updated for new labels.

---

## Regression Verification

| Check | Result |
|-------|--------|
| ADMIN nav includes Aquisição under Gestão | Unit test asserts labels |
| MEMBER / MEMBER+canRunAcquisition hide Aquisição | Unit test asserts |
| User-facing `Portfólio` in `src/` + `e2e/` | **Zero** remaining matches |
| Carteira copy on my-leads / dashboard | Unchanged |
| Route `/app/portfolio` | Unchanged |
| Breadcrumbs / page heading demos | Updated to Demos |
| `/app/leads` import | Already correct |
| next-env.d.ts | Restored after accidental build rewrite |

---

## Remaining Findings

From audit, **not** addressed in F1:

### Remaining P0
- Minha fila density (card-first daily queue)
- `/app/leads` capability gaps (search/columns/pagination) — correctness import OK; product thinness remains P0/P1

### Remaining P1
- Rename/explain Inteligência
- Pipeline densify + desktop/mobile merge
- Equipe as real table
- Portfolio/demos visual polish (covers) — naming done; covers remain

### Other
- Auth brand marketing panel (P2)
- Dashboard KPI deep-links (P2)
- Lead detail card nesting (P2)
- Internal folder naming debt (`features/portfolio` dual meaning)
- Equipe UI still labels the `canRunAcquisition` toggle as “Aquisição” (capability for carteira) — distinct from FREE_PULL nav; optional clarify later

---

## Recommended F2

Per audit sequence: **F2 — Design tokens & primitives** (consolidate radius/type/spacing; AppCard policy; PageFrame/shell width), **or** jump to **F4 — Minha fila density** if product priority is daily operator throughput over token cleanup.

Suggested default from audit: keep **F2 foundation** before large list density work so F4 reuses panel/list conventions.

**NO F2 WORK STARTED.**
