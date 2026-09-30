# F2 — Design Foundations

**Phase:** Product UI v2 — Tokens & primitives normalization  
**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Depends on:** F1 (uncommitted, preserved)  
**Sources:** `docs/audits/PROSPECTA_PRODUCT_UI_AUDIT.md`, `docs/audits/PROSPECTA_PRODUCT_UI_F1_REPORT.md`

---

## Scope

Establish a restrained visual foundation for operational B2B software **without** screen IA redesigns and **without** Auth visual cleanup.

| In scope | Out of scope |
|----------|--------------|
| Theme tokens (radius aliases, text styles) | Minha fila / Pipeline / Intelligence density |
| Shared primitives (Button, Input, Card, Table) | Auth gradient/blur removal |
| Shell focus ring + sidebar control radius | New brand palette / fonts |
| Documented policies | Business logic, schema, API |
| LeadTable chrome via shared Table | New columns / filters / search |

---

## Current Visual System

Mapped from repository evidence before changes:

| Area | State | Notes |
|------|-------|-------|
| **Colors** | CONSISTENT | Brand teal + success/warning/danger scales; semantic solid/fg/muted/subtle |
| **Surfaces** | CONSISTENT | Chakra `bg` / `bg.subtle` / `bg.muted`; outline cards |
| **Borders** | CONSISTENT | `borderWidth="1px"` + `border` token dominant |
| **Radius** | DUPLICATED | Only `button` (6px) + `card` (12px) tokens; many call sites also use Chakra `md` |
| **Shadows** | CONSISTENT (absent) | No `boxShadow` in product TSX — border-first already |
| **Typography** | PARTIAL | `pageTitle` / `sectionTitle` / `meta` exist; lots of ad-hoc `fontSize` |
| **Spacing** | CONSISTENT | `sm/md/lg/touch` + Chakra scale |
| **Buttons** | CONSISTENT | `@/components/ui/button` brand + radius |
| **Form controls** | CONSISTENT | Input/PasswordInput radius aligned to button |
| **Badges** | ONE-OFF per domain | Stage/source/qualification/role — semantic use, some rainbow (stage purple/cyan) |
| **Tables** | ONE-OFF | Only `LeadTable` as real table; no shared wrapper |
| **Cards** | DUPLICATED | `AppCard` unused; features import Chakra `Card` + repeat `outline`/`card` |
| **Motion** | CONSISTENT | Minimal CSS transitions only; no Framer |

---

## Verified Audit Findings

| Audit claim | Verified? | F2 action |
|-------------|-----------|-----------|
| AppCard unused / Card.Root sprawl | Yes | Adopt: `Card.Root` → `AppCard` defaults in `@/components/ui/card` |
| Border > shadow already true | Yes | Preserve; no new shadow tokens |
| Radius card 12px / button 6px | Yes | Add semantic `control` / `surface`; keep aliases |
| textStyles incomplete for ops | Partial | Add `body` + `data` |
| Shell focus `blue.500` vs brand | Yes | → `brand.focusRing` |
| Auth is AI-template hotspot | Yes | **Intentionally not changed** |
| Stage badge rainbow | Yes | Deferred (screen-visible, not foundation-only) |

---

## Token Decisions

### Added

| Token | Value | Role |
|-------|-------|------|
| `radii.control` | 0.375rem (6px) | Buttons, inputs, nav controls |
| `radii.surface` | 0.75rem (12px) | Cards / bordered panels |
| `textStyles.body` | 0.875rem / 400 / 1.45 | Operational body |
| `textStyles.data` | 0.875rem / 400 / 1.35 | Dense table/list/form content |

### Changed

| Item | Change |
|------|--------|
| Button / Input / PasswordInput default radius | `button` → `control` (same px) |
| AppCard default radius | `card` → `surface` (same px) |
| PageSkeleton radii | `md`/`card` → `control`/`surface` |

### Preserved

- Brand / success / warning / danger color scales (no rebrand)
- `radii.button` and `radii.card` as **aliases** (existing call sites keep working)
- Spacing `sm/md/lg/touch`, container sizes, sidebar sizes
- Semantic color tokens (`brand.solid`, `focusRing`, etc.)
- No product shadow tokens (overlays keep Chakra defaults when needed)

---

## Primitive Decisions

| Primitive | Decision | Rationale |
|-----------|----------|-----------|
| `Button` | KEEP + default `control` | Already high reuse |
| `Input` / `PasswordInput` | KEEP + default `control` | Align with Button |
| `AppCard` / `Card` | ADOPT | `Card.Root` is now `AppCard` (outline + surface) |
| `AppTableRoot` / `Table` | CREATED | Shared sm + outline chrome; LeadTable consumer |
| `PageHeading` / `SectionHeading` | KEEP | Already use textStyles |
| `AppEmptyState` / `PageSkeleton` | KEEP (+ skeleton radii) | Operational empties/loading |
| `Tooltip` / `Toaster` | KEEP | No inconsistency found |
| Select / Dialog wrappers | NOT abstracted | No repeated inconsistent pattern worth a wrapper |
| Domain badges | KEEP as-is | Domain meaning; palette cleanup later |

**Note:** Many feature files still import `Card` from `@chakra-ui/react` with explicit `variant="outline" borderRadius="card"`. F2 does **not** mass-migrate those imports (would touch every screen file without IA benefit). New code and `@/components/ui` consumers get defaults. Mass import migration can ride with later screen phases.

---

## Radius Policy

| Token | Use |
|-------|-----|
| `control` | Interactive controls (button, input, sidebar nav item, compact chips) |
| `surface` | Bordered panels and entity cards |
| `full` | Avoid in product chrome; Auth decorative blobs only (unchanged) |
| Chakra `md` | Prefer `control` when meaning is a control |

Do not flatten everything to square. Do not invent a third operational radius.

---

## Border / Shadow Policy

**BORDER > SHADOW** for ordinary content separation.

- Prefer `borderWidth` + `border` / semantic border colors + `bg`.
- Do not add elevation shadows to cards, KPI panels, queue rows, or page sections.
- Legitimate floating UI (Menu, Tooltip, future Dialog) may use Chakra overlay defaults — no custom glow.

F2 adds **zero** shadow tokens.

---

## Card Policy

**CARD WHEN:**
- entity (lead header, demo model, job);
- bounded interactive object (queue row as clickable card — until F4 densifies);
- genuinely independent information group (playbook, intelligence panel, next-action rail).

**NOT CARD WHEN:**
- ordinary section (use Stack + optional border);
- page container;
- table wrapper without reason;
- label/value pairs;
- decorative grouping.

F2 **documents** this policy and adopts `AppCard` defaults. F2 does **not** strip cards from Minha fila / Pipeline / dashboard (later phases).

---

## Status / Badge Policy

| Intent | Palette family |
|--------|----------------|
| Success / active / won | `success` |
| Warning / due today | `warning` |
| Error / overdue / lost | `danger` |
| Neutral / source / muted | `gray` |
| Brand emphasis / progress | `brand` |
| Informational alerts | Chakra `info` / Alert |

Badges must encode domain meaning (stage, qualification, role, job status) — not decoration.

**Deferred:** stage palette includes `blue` / `cyan` / `purple` (`lead-stage-badge.tsx`). Changing that is a visible product change deferred past F2.

---

## Table Foundation

`src/components/ui/table.tsx`:

- Default `size="sm"`, `variant="outline"`
- Hover row styling remains at feature level (`LeadTable`)
- No column redesign, pagination, or selection in F2

`LeadTable` now imports shared `Table` (chrome only).

---

## Form Foundation

| Control | Height / radius / focus |
|---------|-------------------------|
| `Input` | Chakra default height; `control` radius |
| `PasswordInput` | Same radius; visibility toggle labeled |
| `Button` | Brand default; `control` radius; `minH="touch"` at call sites preserved |
| Errors | Existing `Alert` / `role="alert"` patterns unchanged |

No form layout redesign.

---

## Motion Policy

| Allowed | Questioned |
|---------|------------|
| Feedback (hover bg, active) | Entrance theater |
| State transition (sidebar width 0.15s) | Hover scale |
| Loading skeleton pulse | Animated gradients |

F2 did not purge animations; none decorative beyond Auth (excluded).

---

## Accessibility

Touched surfaces:

- Skip-nav main focus ring → `brand.focusRing` (visible, brand-aligned)
- Password visibility `aria-label` preserved
- Table semantic structure preserved
- No removal of labels, roles, or keyboard affordances

---

## Files Changed

| File | Change |
|------|--------|
| `src/theme/index.ts` | `radii.control` / `radii.surface`; aliases documented |
| `src/theme/text-styles.ts` | `body`, `data` |
| `src/components/ui/card.tsx` | `Card.Root` = `AppCard`; surface defaults |
| `src/components/ui/button.tsx` | default radius `control` |
| `src/components/ui/input.tsx` | default radius `control` |
| `src/components/ui/password-input.tsx` | default radius `control` |
| `src/components/ui/table.tsx` | **new** AppTableRoot + Table compound |
| `src/components/ui/page-skeleton.tsx` | control/surface radii |
| `src/components/ui/index.ts` | export Table |
| `src/components/layout/app-shell.tsx` | focus ring brand |
| `src/components/layout/app-sidebar.tsx` | nav/profile `control` radius |
| `src/features/leads/components/lead-table.tsx` | use shared Table |
| `docs/audits/PROSPECTA_PRODUCT_UI_F2_REPORT.md` | this report |
| `docs/audits/PROSPECTA_PRODUCT_UI_AUDIT.md` | F2 status |

F1 files remain modified and untouched by F2 intent.

---

## Intentionally Not Changed

- Auth brand panels (gradient / blur / marketing copy)
- Any product screen IA (fila, pipeline, intelligence, equipe, demos, acquisition)
- Card sprawl mass-migration to `@/components/ui/card`
- Stage/qualification color maps
- Double Container + PageFrame width (shell) — later shell refine
- Business logic, Prisma, authz, jobs
- New font families / gradients / glass
- Shadow token introduction

---

## Validation

| Command | Result |
|---------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (0 errors; 1 pre-existing warning in smoke script) |
| `npx --no-install tsx --test … nav-config.test.ts` | Pass 8/8 (F1 preserved) |
| `npm run build` | Pass |

No new snapshot tests (styling-only foundation).

---

## Regression

| Surface | Expectation after F2 |
|---------|----------------------|
| Navigation / shell | Same IA; focus ring brand; control radius on nav |
| Minha fila | Unchanged structure; cards still present |
| Leads | Same columns; shared table chrome |
| Inteligência / Pipeline / Equipe / Demos / Aquisição | Structure unchanged |
| Auth | Unchanged visuals (shared Button/Input radius only if used) |

Manual browser pass not run in this environment; build + typecheck confirm compile of all routes.

---

## Remaining Design Debt

| Debt | Priority | Owner phase |
|------|----------|-------------|
| Minha fila card density | P0 | F3/F4 (screen) |
| Leads table capability (search/columns) | P0/P1 | Later leads phase |
| Inteligência naming | P1 | F3 nav clarity or screen phase |
| Pipeline densify + dual board | P1 | Later |
| Equipe cards → table | P1 | Later |
| Mass `Card` import → `@/components/ui` | P3 | Opportunistic |
| Stage badge purple/cyan | P2 | With pipeline polish |
| Auth marketing shell | P2 | Dedicated Auth phase |
| Ad-hoc fontSize → textStyles | P2–P3 | Opportunistic per screen |
| Shell Container + PageFrame double maxW | P2 | Shell refine |

---

## Recommended F3

Per audit sequence after foundations:

**F3 — App shell nav clarity** (Inteligência label / help; optional shell width single constraint)

**or**, if operator throughput is the product priority:

**F4 — Minha fila density** (list/row densification; merge summary into filters) — now safer because radius/card/table policies exist.

Default recommendation: **F3 shell/nav clarity** (small) then **F4 Minha fila** (largest remaining P0 UX).

**NO F3 SCREEN REDESIGN STARTED.**
