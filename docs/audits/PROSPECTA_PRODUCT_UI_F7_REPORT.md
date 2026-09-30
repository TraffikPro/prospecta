# F7 — Pipeline / Commercial Stage Overview

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Business logic changed:** NO

---

## Product Responsibility

**Pipeline answers:** “Em que etapa comercial estão minhas oportunidades?”

Distinct from Minha fila (urgency), Prioridades (score), Leads (inventory).

Stage transitions remain on **Lead Detail** (`moveLeadStage`), not on the board.

---

## Dataset / ACL

| Role | Scope |
|------|--------|
| MEMBER | Own leads (`leadListScopeForViewer`) |
| ADMIN | All leads |

Same ownership semantics as Leads. Verified via `getPipelineView`.

---

## Stage Model

| Fact | Value |
|------|--------|
| Stages | NEW → QUALIFIED → CONTACTED → MEETING → WON → LOST |
| Ordering | `LEAD_STAGE_ORDER` |
| Terminal | WON, LOST (still shown as sections) |
| Assignment | Exactly one `Lead.stage` per lead |
| Lifecycle | Lead commercial stage (not separate Opportunity entity) |
| Transitions | Manual via detail form; LOST requires reason; server-authoritative |
| DnD | **None** |

---

## Previous Presentation

- Accordion stages (already not Kanban)
- Lead items as **large outline cards** in a 3-column grid
- Explicit “Abrir lead” button per card
- Preview **3** leads / non-selected stage
- Duplicate near-identical desktop/mobile accordion trees
- Meta focused on accordion UX rather than lifecycle job

---

## Layout Decision

**Kept: stage sections (accordion)** — Option C.

Evidence: existing product already chose accordion + per-stage pagination over Kanban/DnD; F3 confirms stage overview job; mobile Kanban columns would regress. Density fix targets **items inside stages**, not inventing a board.

---

## New Presentation

- Compact **row** lead items (border surface, whole-row link)
- Vertical stack per stage (no card grid)
- Headers: `Badge label · count`
- Total cycle count under heading
- Preview size **8** (was 3); selected stage still pages at **25**
- WON/LOST remain sections; empty terminals slightly muted
- Link to Leads: “Ver inventário”

---

## Density

More leads visible per expanded stage; less chrome (no per-row button stack / card padding).

---

## Stage Headers

`Novo · 12` pattern via badge + muted count. No KPI decoration.

---

## Lead Information

| Priority | Fields |
|----------|--------|
| P1 | Company (open) |
| P2 | Score (compact), source, follow-up, LOST reason |
| P3 | Full contact/history/stage move → Lead Detail |

**Owner:** not in `pipelineLeadSelect` — **DATA GAP** (not fabricated).

---

## Stage Transitions

| Item | Status |
|------|--------|
| Mechanism | Lead Detail `moveLeadStage` / form |
| Board DnD | Absent — not added |
| Rules | Unchanged |

---

## Won / Lost

Normal accordion sections (required by pipeline semantics). LOST shows `lostReason` when present. Empty terminals slightly lower opacity.

---

## Filters

None added (stage partitioning is the filter). No Leads toolbar copy.

---

## Responsive

Same accordion model on desktop and mobile (no 6-column squeeze). Existing `pipeline-desktop` / `pipeline-mobile` hooks preserved for e2e.

---

## Accessibility

Semantic links; focus via native link; stage labels + counts (not color-only); touch `minH`; accordion triggers.

---

## Query / Performance

Unchanged architecture:

1. `countPipelineLeadsByStage`
2. Per-stage `listPipelineLeadsPage` (preview or page)

Scale: counts are exact; selected stage paginated; others preview-capped. Documented.

---

## Data Gaps

| Gap | Notes |
|-----|-------|
| Owner on pipeline rows | Select omits owner |
| Authenticated visual QA | Still blocked |
| E2E execution | Specs updated historically; not run this session |

---

## Files Changed

- `src/features/pipeline/components/lead-stage-card.tsx`
- `src/features/pipeline/components/stage-column.tsx`
- `src/features/pipeline/components/stage-badge.tsx`
- `src/features/pipeline/components/pipeline-board.tsx`
- `src/features/pipeline/pipeline.constants.ts` (+ test)
- `src/app/(authenticated)/app/pipeline/page.tsx`
- `src/app/(authenticated)/app/pipeline/loading.tsx`
- `src/server/services/lead.service.ts` (re-export constants; preview size)

---

## Tests

- Unit: stage order + preview/page sizes
- E2E: existing pipeline foundation (company link still primary) — not executed here

---

## Validation

See stop report.

---

## Visual Verification

**AUTHENTICATED VISUAL QA STILL BLOCKED** (F4–F7).

---

## Remaining Debt

- Authenticated visual QA F4–F7
- Unexecuted e2e updates from F4–F7
- Leads / Prioridades unbounded lists (F5/F6)
- Pipeline owner column (optional)

---

## Recommended F8

**Global polish & visual QA pass** — authenticated screenshots for F4–F7, shared empty/loading consistency, and execution of updated e2e — without new feature screens.
