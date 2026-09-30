# F11 — Equipe / Ownership & Team Operations

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Working tree:** F1–F10 preserved + F11 Equipe presentation; **no commit / no push**.  
**Business logic changed:** **NO**

---

## Product Responsibility

**Equipe answers:** “Quem está na operação, qual é seu papel e como a responsabilidade comercial está distribuída?”

ADMIN-only operational surface — not HR, not employee scoring, not a new permission system.

---

## Current Capability Map

| Capability | Status | Notes |
| --- | --- | --- |
| LIST MEMBERS | **EXISTS** | `getAdminUsers` / `listUsersForAdmin` |
| VIEW ROLE | **EXISTS** | ADMIN / MEMBER badges |
| CHANGE ROLE | **MISSING** | Deferred (permission redesign) |
| INVITE / CREATE | **MISSING** | Seed/provisioning only — not invented |
| REMOVE / DISABLE | **MISSING** | `isActive` display only |
| VIEW OWNED LEADS | **PARTIAL → exposed** | Open (non-terminal) count via Prisma `_count` |
| VIEW ASSIGNMENT | **NOT APPROPRIATE** | Lives on HIGH pool / lead detail |
| VIEW CARTEIRA | **PARTIAL** | Weekly **meta** (`weeklyTarget`) only — not fill slots |
| VIEW ACTIVITY | **MISSING** | Not appropriate as surveillance |
| FILTER | **MISSING** | Small team — not justified |
| SEARCH | **MISSING** | Small team — not justified |
| Aquisição toggle | **EXISTS** | MEMBER Autorizar/Revogar |
| Meta semanal | **EXISTS** | setWeeklyQuotaAction |

---

## ACL

| Layer | Behavior |
| --- | --- |
| Page | `requireRole(..., "ADMIN")` → login / `forbidden()` |
| Actions | Server `requireRole` + service re-checks |
| Nav | `visibility: "admin"` |

MEMBER direct `/admin/users` remains unauthorized (content-level E2E; streaming may report HTTP 200 on loading shell — see Defects).

---

## Domain Model

| Concept | Relation to Equipe |
| --- | --- |
| User | Account identity (name, email, role, isActive) |
| Role | ADMIN \| MEMBER (display + acquisition rules) |
| Lead ownership | Open owned lead **count** (aggregated) |
| OperatorWeeklyQuota | Editable weekly HIGH meta |
| WeeklyPortfolio / LeadAssignment | **Not** listed on Equipe (allocation machinery elsewhere) |

---

## Previous Presentation

- Card grid (`SimpleGrid` + avatar circles) despite “UsersTable” name
- Dense forms buried per card
- No ownership context
- No loading skeleton
- Decorative Avatar fallbacks

---

## Information Model

### P1

Name · email · role

### P2

Status (Ativo/Inativo) · open owned leads · aquisição · meta semanal (HIGH)

### P3

Internal ids (not shown)

---

## New Presentation

- **Desktop / medium:** dense `Table` — Pessoa | Papel | Status | Leads abertos | Aquisição | Meta semanal
- **Mobile:** compact bordered rows (identity → role/status → ownership → actions)
- Factual count: `N membros`
- No avatars; role text-first (gray badge)
- Empty state factual (no invite CTA invention)
- `loading.tsx` → `PageSkeleton` queue density

---

## Roles

Labels unchanged (`Admin` / `Membro`). No permission meaning change. Status not color-only (`data-role` + text).

---

## Ownership Context

`openOwnedLeads` = count of owned leads with `stage notIn (WON, LOST)` via `_count` in the **same** `findMany` — no N+1.

---

## Weekly Allocation Decision

**Keep meta semanal only.** Helps ADMIN set commercial capacity. Do **not** dump WeeklyPortfolio / fill / assignment internals on this page.

---

## Actions

| Class | Action |
| --- | --- |
| PRIMARY (operational) | Autorizar/Revogar aquisição (MEMBER); Salvar meta |
| SECONDARY | — |
| DESTRUCTIVE | None (remove/disable not implemented) |

---

## Search / Filters Decision

**Not added** — seeded team is small; toolbar would be CRM noise.

---

## Responsive

| Viewport | Behavior |
| --- | --- |
| Desktop | Full table |
| Medium | Table; Status column `hideBelow="lg"` |
| Mobile | Stacked member rows; touch targets on actions |

---

## Accessibility

- Table headers / row structure
- Form labels on quota inputs
- Role/status text + `data-*`
- Alerts on action errors
- Touch `minH` on buttons
- Empty state without fake invite

---

## Query / Performance

One `findMany` with `weeklyQuota` join + `_count.ownedLeads` filtered. Mutations unchanged (revalidate path).

---

## Data Gaps

- No invite / role change / disable in product freeze
- No activity attribution on Equipe (intentional)
- Streaming `loading.tsx` can make Playwright `goto` status ≠ 403 while forbidden content is correct

---

## Files Changed

- `src/app/(authenticated)/admin/users/page.tsx`
- `src/app/(authenticated)/admin/users/loading.tsx` (new)
- `src/features/admin/components/users-table.tsx`
- `src/features/admin/components/role-badge.tsx`
- `src/features/admin/components/status-badge.tsx`
- `src/features/admin/team-presentation.ts` (+ test)
- `src/server/repositories/user.repository.ts`
- `src/server/services/user.service.ts` (`_count` on mutation select)
- `e2e/auth.spec.ts`, `e2e/mobile-experience.spec.ts`
- Screenshots: `docs/product/assets/ui-v2/equipe-*.png`

---

## Tests

| Suite | Result |
| --- | --- |
| typecheck | PASS |
| lint | PASS (1 pre-existing warning) |
| unit (`npm run test`) | **367** pass |
| build | PASS |

---

## E2E

Local Docker `:5433`, empty Upstash, serial workers.

- auth (incl. Equipe table + MEMBER forbidden content): PASS  
- breadcrumbs Equipe: PASS  
- mobile MEMBER forbidden: PASS  
- visual-foundation: PASS  

---

## Visual QA

Authenticated ADMIN; seeded users.

| Viewport | Result |
| --- | --- |
| Desktop | Dense table; roles + open leads + actions readable |
| Medium | Table without horizontal squeeze |
| Mobile | Compact rows; actions reachable |

Assets: `equipe-desktop.png`, `equipe-medium.png`, `equipe-mobile.png`.

---

## Remaining Product Debt

- Invite / role change / deactivate (product “NOT YET”)
- Auth surfaces redesign
- Demos redesign
- Subjective polish pass

---

## Remaining Technical Debt

- F10: Fila full open retrieve; Prioridades candidate set; parallel E2E load
- Playwright status vs streaming forbidden (assert content)
- Local `.env` Neon hygiene (human)

---

## Recommended F12

1. **Auth surfaces** polish (login / password flows) — presentation only if still in Product UI V2.  
2. **Demos** (`/app/portfolio`) coherence pass.  
3. Optional invite/role governance **only** after explicit product-grill BUILD.  
4. Do not start employee analytics.

---

## Environment declaration

- Ambiente: local Docker `:5433` + `next dev`  
- Mutações: nenhuma em produção; E2E login only  
- Migrations: nenhuma  
- Produção: **não modificada**

---

**F11 COMPLETE — NO F12 WORK STARTED. NO COMMIT. NO PUSH.**
