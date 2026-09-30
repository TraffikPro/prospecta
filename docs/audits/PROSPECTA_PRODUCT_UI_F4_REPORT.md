# F4 — Minha Fila / Daily Work Queue

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Scope:** Presentation + UX of Minha fila; micro-rename Inteligência → Prioridades  
**Business logic changed:** NO

---

## Previous Experience

Minha fila (`/app/my-leads`) was a **card-first** work surface:

1. Title mismatch: nav **Minha fila** vs H1 **Minha operação**
2. Marketing-style **WeeklyPortfolioBanner**
3. Decorative **MyQueueSummaryCards** duplicating filter counts
4. Large queue cards with score emphasis and low information density
5. CTA copy **Abrir lead** / **Registrar contato**

Urgency existed (sections + ordering) but competed with cards, summary KPIs, and score chrome.

---

## Product Goal

Make Minha fila answer, within seconds:

> **Qual lead precisa da minha ação agora?**

Optimize for **SCAN → DECIDE → OPEN → ACT** without becoming Prioridades, Pipeline, Leads, or a KPI dashboard.

---

## Verified Dataset

| Fact | Source |
|------|--------|
| Owned leads only | `listLeadsForOwnerQueue(ownerId)` |
| Open stages only | `stage: { notIn: ["WON", "LOST"] }` |
| Activities (latest) | included for next-action / conversation filter |
| Intelligence JSON | parsed for score / qualification / campaign |
| Weekly portfolio + wallet fill | `getPortfolioSummaryForUser` + `getWalletFillStatus` |

**Not invented for F4:** location/city, owner name on row, last activity timestamp as a dedicated field (status/outcome labels come from `nextAction`).

---

## Urgency Model

Unchanged domain buckets (`buildMyQueue`):

| Bucket | Title | Meaning |
|--------|-------|---------|
| `overdue` | Atrasados | Has commercial activity + follow-up overdue |
| `due_today` | Follow-up hoje | Follow-up due today |
| `no_contact` | Sem contato | No commercial activity yet |
| `other` | Demais | Remaining open owned leads |

**Order:** section order above, then **score desc**, then company name.

Filters (`all` / `new` / `follow-up` / `overdue` / `conversation`) unchanged; counts remain on filter chips.

---

## Information Hierarchy

| Priority | Fields shown in row |
|----------|---------------------|
| **P1** | Company, next action label, urgency (section + border accent) |
| **P2** | Stage, score · qualification, status label, follow-up time |
| **P3** | Full intelligence, history, channels → Lead Detail |

---

## Layout Decision

**Section → compact count → row list**

- Removed `MyQueueSummaryCards` from the page (component left deprecated)
- Compact carteira strip (border surface, inline metrics)
- Row-first queue items (`data-testid="my-queue-row"`)
- Loading uses `PageSkeleton` `density="queue"` (thinner bars)

---

## Card → Row Decisions

| Before | After |
|--------|-------|
| Card grid with heavy chrome | Compact bordered rows |
| Giant score / card hierarchy | Compact `91 · Alta` text |
| Summary KPI cards | Filter chip counts only |
| Banner as hero | Contextual strip |

---

## Actions

| Action | Implementation |
|--------|----------------|
| **Primary** | **Abrir** → lead detail (`from=my-leads`) |
| Secondary | **Registrar** → `#register-activity` |
| Row identity | Semantic `NextLink` on content block (`my-queue-row-link`) |

No stage-change or contact-from-queue beyond existing deep links.

---

## Carteira Context

Preserved: week label, meta / recebidos / tratados / pendentes / vagas, fill button + result copy when applicable.

Visual weight reduced: flat border surface, denser typography — not a marketing banner.

---

## Responsive

- Desktop: horizontal row (content + actions)
- Mobile: stacked content + full-width Abrir / Registrar
- Essential preserved: company, next action, urgency accent, primary CTAs
- Secondary (stage/score/follow-up) wrap; no forced multi-column squeeze

---

## Accessibility

- Sections with `aria-labelledby`
- Semantic links for Abrir / Registrar / row open
- Urgency not color-only (section title + count + accent)
- Touch targets via `minH="touch"`
- Focus follows native link/button chrome (F2 brand focus on shell)

---

## Prioridades Rename

| Surface | Change |
|---------|--------|
| Nav / mobile primary | **Prioridades** |
| Page H1 + breadcrumb origin | **Prioridades** |
| Empty copy | score language (not “inteligência”) |
| Route | **`/app/intelligence` preserved** |
| Internal ids / services / DB | **preserved** (`intelligence`, `getIntelligenceInbox`, Lead Intelligence card on detail) |

Lead detail “Inteligência do lead” **intentionally unchanged** (domain payload label, not nav job).

---

## Data Gaps

| Desired | Status |
|---------|--------|
| City / location on row | **DATA GAP** — not on queue query |
| Explicit last activity timestamp | **DATA GAP** — only next-action status/follow-up |
| Owner column | N/A for owned-only queue |
| Error boundary + retry on page | **DEFERRED** — no local error path wired; would need architecture |

---

## Files Changed

**Minha fila**

- `src/app/(authenticated)/app/my-leads/page.tsx`
- `src/app/(authenticated)/app/my-leads/loading.tsx`
- `src/features/leads/components/my-queue-list.tsx`
- `src/features/leads/my-queue.ts` (+ empty copy, `stage` on item)
- `src/features/leads/my-queue.test.ts`
- `src/features/portfolio/components/weekly-portfolio-banner.tsx`
- `src/features/leads/components/my-queue-summary.tsx` (deprecated)
- `src/components/ui/page-skeleton.tsx` (`density="queue"`)

**Prioridades naming**

- `src/components/navigation/nav-config.ts`
- `src/components/navigation/nav-config.test.ts`
- `src/components/navigation/breadcrumb-context.ts`
- `src/app/(authenticated)/app/intelligence/page.tsx`

**E2E**

- `e2e/my-leads.spec.ts`, `breadcrumbs.spec.ts`, `mobile-experience.spec.ts`, `intelligence-inbox.spec.ts`, `visual-foundation.spec.ts`, `password-reset.spec.ts`, `must-change-password.spec.ts`

---

## Tests

- Unit: `buildMyQueue` ordering + stage passthrough + empty view
- Unit: nav label Prioridades + route preserved
- E2E selectors updated (heading, row, Abrir/Registrar, Prioridades breadcrumb)

---

## Validation

| Check | Command | Result |
|-------|---------|--------|
| typecheck | `npm run typecheck` | **pass** |
| lint | `npm run lint` | **pass** (1 pre-existing warning in `scripts/smoke-breadcrumbs-prod.mjs`) |
| unit | `npx tsx --test … my-queue.test.ts nav-config.test.ts` | **14 pass / 0 fail** |
| build | `npm run build` | **pass** |
| e2e | Playwright my-leads / breadcrumbs / intelligence | **not run this session** (specs updated; DB/server available for follow-up) |

`next-env.d.ts` was reverted after build auto-edit (kept committed import path).

---

## Visual Verification

Attempted authenticated review via local `next start` on `127.0.0.1:3010` (Postgres on `:5433` up).

| Viewport | Minha fila |
|----------|------------|
| Desktop (~1440) | **Not verified** — login returned generic failure (`Não foi possível concluir agora…`); queue UI not reached |
| Medium | **Not verified** (same) |
| Mobile (~390) | **Not verified** (same) |

Login chrome itself rendered (F2 surfaces). Authenticated queue screenshots deferred until local auth/seed works for this session.

---

## Intentionally Deferred

- Redesign of Prioridades / Pipeline / Leads / Equipe / Demos / Aquisição / Auth
- Queue search / extra filters
- New error architecture for Minha fila
- Location / last-activity fields without query changes
- Deleting `my-queue-summary.tsx` file (deprecated in place)

---

## Recommended F5

**Leads inventory density** — apply the same row-first / operational language to `/app/leads` (list + create affordance), without merging it into Minha fila.

Alternate if product prefers: Pipeline stage readability (subtle stage treatment only).
