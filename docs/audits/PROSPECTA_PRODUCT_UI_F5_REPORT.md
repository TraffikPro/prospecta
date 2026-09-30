# F5 — Leads Inventory

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Scope:** Searchable CRM inventory presentation + server-side filter WHERE  
**Business logic changed:** NO (ownership/ACL/allocation/score unchanged)

---

## Previous Experience

`/app/leads` was a thin list:

- Heading + “+ Novo Lead”
- `LeadTable` with Empresa / Stage / Origem only
- No search, no filters, no owner column
- Empty: plain muted text
- Unbounded `getLeads` fetch (all stages; MEMBER=own, ADMIN=all)

---

## Product Responsibility

**Leads answers:** “Quais leads existem e como encontro o que preciso?”

Not Minha fila (urgency), not Prioridades (score inbox), not Pipeline (stage board).

---

## Dataset

Verified against code:

| Fact | Source |
|------|--------|
| MEMBER | `leadListScopeForViewer` → `ownerId` forced in WHERE |
| ADMIN | `access: all`; optional `owner` filter |
| Stages | **All** including WON/LOST |
| Order | `createdAt desc` (unchanged) |

---

## Role Behavior

| Role | Inventory | Owner column | Owner filter |
|------|-----------|--------------|--------------|
| MEMBER | Own leads only | Hidden | Hidden (client `owner` ignored) |
| ADMIN | All leads | Shown | Shown (`getAdminUsers` options) |

Authorization remains server-side via `buildLeadInventoryWhere` + scope.

---

## Capability Before/After

| Capability | Before | After |
|------------|--------|-------|
| SEARCH | MISSING | **EXISTS** — company, contact, email, phone |
| FILTER BY STAGE | MISSING | **EXISTS** |
| FILTER BY OWNER | MISSING | **EXISTS** (ADMIN only) |
| FILTER BY SCORE | MISSING | **NOT APPROPRIATE** (Prioridades) |
| FILTER BY STATUS/urgency | MISSING | **NOT APPROPRIATE** (Fila) |
| SORT | PARTIAL (fixed createdAt desc) | unchanged — no UI sort |
| PAGINATION | MISSING | **MISSING** — documented scale risk |
| CREATE | EXISTS | preserved |
| OPEN DETAIL | EXISTS | preserved (row link) |
| BULK / ARCHIVE / DELETE | MISSING | **NOT APPROPRIATE** |

---

## Information Model

| Field | Priority | Shown |
|-------|----------|-------|
| Company | P1 | Yes |
| Stage | P1 | Yes |
| Owner | P1 ADMIN / P3 MEMBER | ADMIN only |
| Score | P2 | Compact text |
| Contact | P2 | Desktop lg+ / mobile secondary |
| Source | P2 | Desktop lg+ |
| Created | P2 | Desktop lg+ |
| Location | — | **DATA GAP** |
| Last activity | — | **DATA GAP** (no efficient join in inventory query) |

---

## Search

- **Architecture:** server-side Prisma `OR` + `contains` / `insensitive`
- **Fields:** `companyName`, `contactName`, `email`, `phone`
- **Placeholder:** `Buscar leads...`
- **No** unbounded client-side search of full DB in the browser
- **CNPJ:** not in schema — skipped

---

## Filters

| Filter | Inventory question |
|--------|-------------------|
| Stage | “Show me all Won / Lost / … in the CRM?” |
| Owner (ADMIN) | “Which leads belong to this operator?” |

No urgency filters (Fila). No score band (Prioridades).

---

## Sorting

Fixed `createdAt desc`. UI sort deferred — **CAPABILITY GAP** (would need API contract expansion).

---

## Pagination

**Still absent.** Same scale risk as pre-F5: full matching set returned.

Documented; not introducing complex pagination architecture in F5.

---

## Table Structure

- Desktop (`md+`): `AppTableRoot` / `Table` — Empresa, Contato (lg+), Estágio, Responsável (ADMIN), Score, Origem (lg+), Criado (lg+)
- Mobile: compact inventory rows (identity + stage + score + owner if ADMIN)

---

## Actions

- Page primary: **+ Novo Lead** → `/app/leads/new` (unchanged validation/actions)
- Row primary: open detail via company link (`from=leads`)
- No per-row button clutter

---

## Empty / No Results

| State | Copy | Action |
|-------|------|--------|
| No leads | “Nenhum lead cadastrado.” | + Novo Lead |
| No filter hits | “Nenhum lead encontrado com esses filtros.” | Limpar filtros |

---

## Responsive

See Table Structure. Essential on mobile: company, stage, score, detail link.

---

## Accessibility

- Form labels / `aria-label` on search
- Semantic table on desktop
- Native links for open
- Filter controls `minH="touch"`
- Stage via badge + text (not color alone for identity)

---

## Query / Performance

- One inventory `findMany` with WHERE (search/stage/owner)
- ADMIN may also load `getAdminUsers` for owner options (existing admin listing)
- Score parsed from already-loaded `intelligence` JSON (no N+1 activities)
- No client-side full-table scan

---

## URL State Decision

**Adopted** GET params: `q`, `stage`, `owner`

Evidence: matches Prioridades filter pattern; refresh/share/back work; no client filter state required.

---

## Data Gaps

| Gap | Notes |
|-----|-------|
| LAST ACTIVITY | Would need activity join / denormalized field — deferred |
| LOCATION / CITY | Not on Lead model |
| PAGINATION | Scale risk for large tenants |
| UI SORT | Fixed order only |
| AUTHENTICATED VISUAL QA | Still blocked (F4 debt) — login failed under local `next start` |

---

## Files Changed

- `src/features/leads/lead-inventory.ts` (+ test)
- `src/features/leads/components/lead-inventory-toolbar.tsx`
- `src/features/leads/components/lead-table.tsx`
- `src/app/(authenticated)/app/leads/page.tsx`
- `src/app/(authenticated)/app/leads/loading.tsx`
- `src/server/repositories/lead.repository.ts` (`listLeadsInventory`)
- `src/server/services/lead.service.ts` (`getLeads` filters)
- `src/server/repositories/index.ts`
- `e2e/leads.spec.ts`

---

## Removed Dead Code

- `src/features/leads/components/my-queue-summary.tsx` (`MyQueueSummaryCards`) — zero consumers after F4

---

## Tests

- Unit: parse filters, WHERE ownership ignore, ADMIN owner+search OR
- E2E: inventory search + no-results (spec added; not executed this session)
- Ownership DB tests: not run (production mutation guard on local DATABASE_URL)

---

## Validation

See stop report for typecheck / lint / unit / build.

---

## Visual Verification

**AUTHENTICATED VISUAL QA STILL BLOCKED** (same F4 auth failure under local production start).  
F4 Minha fila + F5 Leads authenticated screenshots **not** completed.

---

## Remaining Debt

- Authenticated visual QA (F4 + F5)
- Pagination for large inventories
- Optional last-activity column without N+1
- E2E execution of new inventory spec

---

## Recommended F6

**Pipeline stage overview polish** — denser stage columns / clearer terminal stages, without absorbing Fila or Leads jobs.
