# F10 — Scale & Runtime Hardening

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Working tree:** F1–F9 preserved + F10 hardening; **no commit / no push**.  
**Business logic changed:** **NO**

---

## Executive Result

Product UI V2 core lists are now **bounded for render** (and Leads for query). Minha fila keeps urgency-first semantics with truthful counts. Local env/docs/guards reduce accidental production Neon use. Pipeline dual DOM removed. Hydration mismatch classified and mitigated. Core E2E runs serially against local Docker.

---

## Baseline Measurements

Local Docker `:5433` (MEMBER `comercial@prospecta.test`):

| Surface | DB rows (approx.) | Pre-F10 retrieve | Pre-F10 render |
| --- | --- | --- | --- |
| Leads inventory | 389 total / ~379 owned | `findMany` **unbounded** | all rows |
| Prioridades | ~167 owned with intelligence | `findMany` all with JSON | all scored cards |
| Minha fila | ~350 owned open | `findMany` all open + 1 activity | all rows (~300 DOM) |

Shared: ACL via `leadListScopeForViewer` (inventory/inbox) or owner id (fila). Sort: Leads `createdAt desc`; Prioridades score desc in memory; Fila urgency buckets then score.

---

## Leads

### Previous Query

`listLeadsInventory(where)` — no `take`/`skip`; `orderBy: createdAt desc`.

### Strategy Decision

**Server-side offset pagination** (page size 25), matching Pipeline. Deterministic `orderBy: [{ createdAt: "desc" }, { id: "desc" }]`. Count via `countLeadsInventory(where)`.

### Pagination

- URL: `?q=&stage=&owner=&page=`
- Filter submit omits `page` → resets to page 1
- Out-of-range `page` clamped + redirect to canonical page

### Search / Filters

Preserved: `q`, `stage`, `owner` (ADMIN). Compose with `page`.

### Count

Toolbar shows **total matching** + page meta (not page length alone).

### ACL

`buildLeadInventoryWhere` still encodes scope first; pagination after authorized `where`.

### Performance

One `count` + one bounded `findMany` per request. No full inventory fetch.

---

## Prioridades

### Previous Query

`listLeadsWithIntelligence` unbounded; `buildIntelligenceInbox` parse/filter/sort in memory; render all.

### Strategy Decision

**Keep authoritative in-memory score sort** (JSON score + `resolveQualification` semantics unchanged). **Paginate the sorted filtered array** (page size 25). Candidate retrieve remains “leads with intelligence JSON” (naturally smaller than full inventory). Denormalized SQL score ORDER BY deferred (would risk qualification edge cases).

### Pagination

URL `?qualification=&source=&page=`; filter chips omit page → page 1. Out-of-range redirect.

### Ordering Stability

Existing sort: score desc, then `companyName` localeCompare. Stable for pagination slices.

### Filters

Qualification + source preserved; counts still from ALL scored set.

### ACL

Unchanged `leadListScopeForViewer`.

### Performance

Still loads intelligence candidates once per request (~167); **DOM bounded to 25**. N+1 avoided (single list query).

---

## Minha Fila

### Urgency Architecture

Classification in `buildMyQueue` via `classifyFollowUp` (server TS) after `listLeadsForOwnerQueue` (owner, non-terminal, latest non–STAGE_CHANGE activity). **Not** a pure SQL window.

### Scale Problem

~350 open leads → huge DOM; E2E filter/click flakes (F9).

### Strategies Evaluated

| Option | Verdict |
| --- | --- |
| A. SQL urgency groups | Incomplete for `no_contact` without activity join rewrite |
| B. Per-bucket limits | **Selected** for `filter=all` |
| C. Load-more per section | Links to existing filters (“Ver todos”) |
| D. Full order + bounded projection | **Selected** (retrieve owner open set; project DOM) |
| E. Virtualization | Rejected for ~350 + complexity/a11y |
| F. Naive LIMIT before classify | **Rejected** — would hide OVERDUE |

### Selected Strategy

1. Retrieve: owner open leads (operationally bounded by portfolio; still full open set for correct classification/counts).
2. `filter=all`: render ≤ **20 rows per urgency section**; `totalCount` truthful; CTA to `?filter=` for overdue / today / new.
3. Single filter: **page size 25** over filtered list; summary counts remain full-queue truthful.

### Correctness

Overdue always appears before lower buckets on `all`. Truncation never promotes `other` over overdue. Counts in headers/filters use full classification.

### Counts

Section title `(totalCount)`; truncation CTA `Ver todos (N)`. Filters summary unchanged.

### DOM Impact

Worst-case `all` ≈ 4×20 = **80 rows** vs ~350. Filter views ≤ 25 rows + pagination.

---

## Environment Safety

### Previous Risk

Local `.env` could point at production Neon (`50218bdd86d8`) while Upstash filled → login fail-closed / dangerous mutable scripts.

### Local Development

`.env.example` clarifies Docker `:5433`, prefer `.env.local`, empty Upstash for memory adapter.

### E2E / QA

`docs/development/local-qa.md` — reproducible F8/F9/F10 workflow with process overrides.

### Production

Unchanged fail-closed Upstash requirement on Vercel.

### Guards

`prisma/seed.ts` now calls `assertSafeForMutableTestsOrThrow` (same fingerprint guard as E2E). Documented in `production-data-hygiene.md`.

### Documentation

- `docs/development/local-qa.md` (new)
- `.env.example` hygiene comments
- `production-data-hygiene.md` seed wiring

---

## Upstash / Auth Local Behavior

| Context | Behavior |
| --- | --- |
| development / test, Upstash empty | Memory adapter |
| production / preview, Upstash missing | Fail-closed (unchanged) |

Empty-string process overrides prevent Next from refilling Upstash from `.env` during local QA.

---

## Hydration Investigation

**Root cause:** `next-themes` `forcedTheme="light"` / `attribute="class"` can disagree with SSR `<html>` lacking `class="light"` → hydration warning.

**Resolution:** set `className="light"` on `<html>` alongside existing `suppressHydrationWarning`. Provider still forces light (no dark-mode product work).

---

## Pipeline Dual DOM Investigation

**Finding:** Desktop + mobile each mounted a full accordion; CSS `display` hid one; duplicate accessible trees + ambiguous `pipeline-stage-*` when both wrappers existed; column also reused the same testid.

**Resolution:** **Single** `pipeline-board` accordion for all breakpoints. Stage testid on accordion item only; body uses `pipeline-stage-body-*`. E2E/smoke/capture scripts updated.

---

## Auth Flake Investigation

**Before:** Parallel suite + huge Fila DOM → login/navigation timeouts under load.  
**After:** Bounding + serial `--workers=1` for core suite; auth passes in serial run. Remaining flake under high parallel load is environmental (Next/dev contention), not auth weakening.

---

## Query / Performance

| Surface | Query bound | Render bound | Extra count query |
| --- | --- | --- | --- |
| Leads | yes (`take`/`skip`) | yes | yes |
| Prioridades | candidate set (intel JSON) | yes (slice) | no (in-memory) |
| Fila | owner open set | yes (section/page) | no |

No N+1 introduced. Stable secondary sorts where paginated at SQL (Leads).

---

## Files Changed (F10 highlights)

- `src/lib/pagination.ts` (+ test)
- `src/components/ui/list-pagination.tsx`
- Leads: `lead-inventory.ts`, repository count/`take`, `getLeads` page, page/toolbar
- Prioridades: inbox href/page, `getIntelligenceInbox` slice, page UI
- Fila: `my-queue.ts` projection, list truncation UI, page + pagination
- Pipeline: single DOM board, stage-column testid
- Env: seed guard, `.env.example`, `docs/development/local-qa.md`
- Hydration: `layout.tsx` `className="light"`
- E2E + smoke scripts updated for pagination / pipeline

---

## Tests

| Suite | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (1 pre-existing warning) |
| `npm run test` | **365** pass |
| `npm run build` | PASS |

New/updated coverage: pagination clamp, inventory page parse, fila truncation + filter page, ownership `getLeads` shape.

---

## E2E

Runtime: local Docker `:5433`, empty Upstash, `next dev`, `--workers=1`.

| Batch | Result |
| --- | --- |
| auth + breadcrumbs + intelligence-inbox + leads + mobile + my-leads | **20/20 PASS** |
| pipeline + visual-foundation + lead-intelligence | **9/9 PASS** |

**Combined core:** **29/29 PASS** (serial).

Leads pagination E2E covers page 2 + out-of-range clamp. Fila/Prioridades/Pipeline E2E adapted to bounded DOM (origin URL / high-score fixtures where needed).

---

## Visual Regression

Targeted authenticated checks via E2E + prior F8/F9 captures; pagination controls restrained (Anterior / Página N de M / Próxima). No Product UI redesign.

---

## Remaining Debt

### Product

- Equipe / Auth / Demos redesign deferred
- Prioridades still loads full intelligence-candidate set (DOM paginated; SQL score index optional later)

### Technical

- Fila still retrieves full owner open set for urgency correctness
- Parallel E2E under heavy load may still flake (prefer serial or sharding)
- Local `.env` may still contain Neon URL until human migrates to `.env.local`
- Favicon / SVG noise

---

## Recommended F11

1. Optional SQL/expression score ordering + DB-level Prioridades pagination if candidate set grows past ~1k.  
2. Equipe / Auth / Demos product redesign (only after scale is stable).  
3. Optional Fila query-level overdue/due_today partitions if open portfolios exceed ~1k.  
4. Human `.env` → `.env.local` migration checklist.

---

## Environment declaration

- Ambiente: local Docker Postgres `127.0.0.1:5433` + `next dev`  
- Operações mutáveis: E2E leads on local DB only  
- Migrations: nenhuma  
- Serviços externos: nenhum  
- Produção: **não modificada**

---

**F10 COMPLETE — NO F11 WORK STARTED. NO COMMIT. NO PUSH.**
