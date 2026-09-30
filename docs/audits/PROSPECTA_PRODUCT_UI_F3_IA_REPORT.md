# Prospecta — Operational Information Architecture

**Phase:** F3 — IA audit (read-only)  
**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Sources:** `PROSPECTA_PRODUCT_UI_AUDIT.md`, F1/F2 reports, product docs, live code  
**Constraint:** No UI implementation. No business-logic changes.

Legend: **CODE FACT** · **PRODUCT INFERENCE** · **RECOMMENDATION**

---

## Executive Summary

As quatro superfícies (`Minha fila`, `Leads`, `Inteligência`, `Pipeline`) são **projeções diferentes da mesma entidade `Lead`**, não quatro bancos de dados.

| Surface | Job real (frase completa) |
|---------|---------------------------|
| **Minha fila** | O usuário abre **Minha fila** quando precisa **trabalhar o próximo lead que exige ação hoje** (atrasado / follow-up / sem contato). |
| **Leads** | O usuário abre **Leads** quando precisa **ver/cadastrar o inventário** (inclui WON/LOST) ou **criar lead manual**. |
| **Inteligência** | O usuário abre **Inteligência** quando precisa **priorizar por score** leads que já têm payload de intelligence. |
| **Pipeline** | O usuário abre **Pipeline** quando precisa **ver/navegar o estoque por stage comercial**. |

**CODE FACT:** `docs/product.md` declara `SCREEN MAP = FREEZE — CORE = Minha fila + detalhe do lead`.  
**CODE FACT:** `postAuthPath` envia `MEMBER` → `/app/my-leads` (`src/server/auth/login-redirect.ts`).  
**CODE FACT:** Dashboard CTAs de operador apontam para `/app/my-leads` (`dashboard.view.ts`).

**RECOMMENDATION:** Manter **Minha fila** como superfície diária primária; **renomear Inteligência**; manter **Pipeline** e **Leads** como secundárias com papéis distintos; não remover Inteligência sem embutir score na fila.

---

## Current Domain Model

### Entity map (evidence)

```text
User (ADMIN | MEMBER, canRunAcquisition)
  │ owns → Lead.ownerId
  │ assignee → LeadAssignment / WeeklyPortfolio
  │
AcquisitionJob (FREE_PULL | WALLET_FILL)
  │ → creates/updates Lead (+ intelligence JSON from Places runner)
  │
Lead
  ├─ companyName, contact fields, source, stage, nextFollowUpAt
  ├─ intelligence Json? (score, qualification, signals, pitch, …)
  ├─ owner User
  ├─ Activity[] (WHATSAPP | EMAIL | NOTE | STAGE_CHANGE)
  └─ LeadAssignment[] (weekly HIGH carteira cycles)
       └─ WeeklyPortfolio (week meta + OperatorWeeklyQuota)
```

There is **no separate Company / Opportunity model**.  
**CODE FACT:** CRM unit is `Lead` (`prisma/schema.prisma`). “Empresa” is `Lead.companyName`.

| ENTITY | SOURCE | OWNER | RELATIONSHIPS | LIFECYCLE | IMPORTANT FIELDS |
|--------|--------|-------|---------------|-----------|------------------|
| **User** | Auth/seed | self | owns leads; assignments; quotas | active flag | role, canRunAcquisition |
| **Lead** | MANUAL / GOOGLE_PLACES / IMPORT / REFERRAL | `ownerId` | activities, assignments, intelligence | stages NEW…WON/LOST | companyName, stage, nextFollowUpAt, intelligence |
| **Activity** | Operator form | authorId | lead | append-only history | type, outcome, body |
| **Lead.intelligence** | Generator / Places callback | — (JSON on lead) | parsed in UI | optional | score, qualification, signals, pitch |
| **WeeklyPortfolio** | get-or-create on assign | userId | assignments | Mon–Sun SP week | targetSnapshot, weekStart/End |
| **LeadAssignment** | wallet-fill / admin reassign / recycle | assigneeId | portfolio, lead | ACTIVE → TREATED / RELEASED | source, dueAt, treatedAt |
| **AcquisitionJob** | ADMIN FREE_PULL or wallet fill | requestedById | runner callback | QUEUED→… | purpose, city, query |

---

## Lead Lifecycle

### Origin → CRM (**CODE FACT**)

1. **Manual** — `/app/leads/new` → `createLeadForOwner` (`lead.service.ts`).
2. **Places / acquisition** — `AcquisitionJob` + internal API → ingest external lead with `intelligence` JSON (`GOOGLE_PLACES`).
3. **Wallet fill** — assigns HIGH leads to operator; **updates `Lead.ownerId`** (`portfolio.service.ts` ~550–553).
4. **Admin reassign / recycle** — assignment cycles; owner pointer updated on assign.

### Stage lifecycle (**CODE FACT** — ADR 0002 + product-decision-mvp)

```text
NEW → QUALIFIED | LOST
QUALIFIED → CONTACTED | LOST
CONTACTED → MEETING | LOST | (stay + follow-ups)
MEETING → WON | LOST | CONTACTED
WON / LOST → terminal
```

Contact truth = **persisted Activity**, not WhatsApp/email click (`docs/adr/0002-pipeline-lead-activity-v1.md`).

### When a lead appears on each surface

| Event | Minha fila | Leads | Inteligência | Pipeline |
|-------|------------|-------|--------------|----------|
| Created / owned by user, stage open | Yes | Yes | Only if intelligence+score+qualification parse | Yes (by stage) |
| Assigned via carteira (owner updated) | Yes (new owner) | Yes | If intel present | Yes |
| Stage → WON/LOST | **Leaves** (`notIn WON/LOST`) | Stays | Stays if intel | Stays in terminal columns |
| Intelligence missing / unparsable | May appear | Appears | **Excluded** | Appears |
| MEMBER views another owner's lead | No (owner scope) | No | No | No |
| ADMIN views | Own queue only (`getMyQueueForOwner(self)`) | **All** leads | **All** with intel | **All** by stage |

### Can the same lead appear in all four?

**CODE FACT / PRODUCT INFERENCE:** Yes, for an open-stage owned lead with valid intelligence:  
fila (active) ∩ leads (all) ∩ intelligence (intel filter) ∩ pipeline (stage bucket).

Terminal leads: Leads + Pipeline + maybe Inteligência; **not** Minha fila.

### Treated / recycled / inactive (**CODE FACT**)

- **Treated (carteira):** WhatsApp/Email activity after assignment marks `LeadAssignment` TREATED (`markAssignmentTreatedInTx`) — lead can remain on fila if stage still open.
- **Week close:** ACTIVE assignments RELEASED; lead may remain owned (owner pointer not necessarily cleared on close — assignment status is the weekly truth).
- **Recycle (ADMIN high-pool):** commercial cycle limit (2); returns HIGH to pool.
- **Discard:** stage `LOST` + reason → leaves fila.

---

## Surface Dataset Comparison

| Surface | Dataset | Query/filter | Ownership | Lifecycle scope |
|---------|---------|--------------|-----------|-----------------|
| **Minha fila** | Owned leads + latest commercial activity | `ownerId` + `stage notIn (WON,LOST)`; UI filter buckets | **Always current user** | Open stages only; work-priority sort |
| **Leads** | All matching leads | `listLeads` / `listLeadsScoped`; no UI filters | MEMBER=own; ADMIN=all | **All stages** including terminal |
| **Inteligência** | Leads with non-null intelligence that parse to score+qualification | `intelligence not DbNull` + pure filter/sort by score | MEMBER=own; ADMIN=all | **No stage exclusion** (terminals can appear) |
| **Pipeline** | Same lead rows grouped by `stage` | counts + paginated per stage | MEMBER=own; ADMIN=all | **All stages** |

### Overlap characterization

**CODE FACT:** Not four datasets — **four views** over `Lead` with different predicates:

1. Fila ⊆ owned ∩ open-stage (strictest work set).  
2. Leads = owned|all (inventory).  
3. Inteligência ⊆ has-parseable-intelligence (score ranking).  
4. Pipeline = owned|all partitioned by stage.

Overlap is **large** for MEMBER: most open owned leads with Places intel appear in fila + intel + pipeline + leads simultaneously.

---

## Minha Fila

### Purpose

**PRIMARY daily work queue** for the signed-in operator.

**CODE FACT hybrid:** work queue (`buildMyQueue`) + **carteira semanal** banner (`WeeklyPortfolioBanner` / fill wallet) on the same page (`my-leads/page.tsx`).

Conceptual class: **A + B + C hybrid** — personal work queue of owned open leads, with weekly portfolio meta attached — **not** a pure dashboard.

### Dataset

- `listLeadsForOwnerQueue(ownerId)` — `src/server/repositories/lead.repository.ts:177-197`
- Excludes WON/LOST
- Buckets: overdue / due_today / no_contact / other (`my-queue.ts`)
- Sort: bucket rank → score desc → company name
- Filters: all | new | follow-up | overdue | conversation

### Actions

- Abrir lead / Registrar contato (hash `#register-activity`)
- Completar carteira (when eligible)
- Filter by work state
- **No** stage move, search, bulk, or contact launch on the card itself (except navigate)

### Problems

1. Title inconsistency: nav “Minha fila” vs H1 “Minha operação” (**CODE FACT**).  
2. Summary cards duplicate filter chips (**PRODUCT INFERENCE:** chrome noise).  
3. Card-dense UI (F0/F2 debt) — not IA fault.  
4. ADMIN also lands on own queue only — no team queue here (team is dashboard `/app`).

### Disposition signal

**KEEP AS PRIMARY** — confirmed by product freeze, post-auth MEMBER path, dashboard CTAs, mobile primary nav first item.

---

## Leads

### Purpose

**Inventory / CRM base list** + **entry for manual create**.

**CODE FACT:** Pipeline empty CTA and “Ver lista” link to `/app/leads` / `/app/leads/new`.  
**CODE FACT:** Nav group “Base comercial” (not “Operação”).

### Dataset

- MEMBER: `listLeadsScoped({ ownerId })` — all stages  
- ADMIN: `listLeads()` — global  
- Columns: companyName, stage, source only (`lead-table.tsx`)
- No search, sort UI, pagination, owner column, score, follow-up

### Actions

- Open lead detail  
- `+ Novo Lead`  
- Empty copy only

### Problems

1. Thin capability vs role as “base” (**verified** — still true after F1).  
2. Overlaps Pipeline as “see all leads by stage” without stage UX.  
3. Overlaps Fila for open owned leads without work prioritization.  
4. Primary reason to keep independent today: **create path** + **terminal inventory** + **ADMIN global list**.

### Disposition signal

**KEEP AS SECONDARY** (inventory + create). Optionally later merge “lista” into Pipeline; do not remove create entry without replacement.

---

## Inteligência

### Purpose

**Score-ranked inbox** of leads that carry Places/generator intelligence.

**CODE FACT page copy:** title “Oportunidades prioritárias”; meta “Fila operacional por score” (`intelligence/page.tsx`).  
**CODE FACT:** Not generative-AI product — JSON `Lead.intelligence` (`parse-intelligence`, score thresholds in `qualification.ts`: ≥70 HIGH, ≥50 MEDIUM).

### Dataset

- `listLeadsWithIntelligence` + `buildIntelligenceInbox`  
- Requires: non-null JSON, parse success, qualification, numeric score  
- Filters: HIGH | MEDIUM | ALL; source GOOGLE_PLACES | MANUAL | ALL  
- **LOW** appears in counts when ALL, but no dedicated filter chip  
- Sort: score desc  
- **Includes terminal stages** if intel present (no stage filter)

### Actions

- Open lead detail only (`LeadScoreCard` as link)  
- Filter chips  
- Empty → clear filters or “Ir para Minha fila”

### Naming Analysis

| Question | Answer |
|----------|--------|
| Would a new user understand “Inteligência” without opening? | **No** — sounds like AI platform, not score inbox (**PRODUCT INFERENCE**) |
| Does in-page title help? | Partially — “Oportunidades prioritárias” is clearer than nav label |
| Accurate job label candidates (evidence-based) | **Prioridades**; **Por score**; **Oportunidades** (matches H1); **Qualificação** (weaker — stage QUALIFIED exists separately) |

**Naming verdict:** **RENAME CANDIDATE**. Prefer a job/data label over “Inteligência”.

Strongest evidence-aligned options:

1. **Prioridades** — matches `qualificationLabels` “Prioridade alta/média” and score ranking.  
2. **Oportunidades** — matches current H1.  
3. Keep route `/app/intelligence` internally (F1-style: label change, path preserved).

### Disposition signal

**RENAME** + **KEEP AS SECONDARY** (or later embed into Fila as score mode — Option B).

---

## Pipeline

### Purpose

**Stage-centric inventory** of the commercial funnel.

**CODE FACT:** Accordion per `LEAD_STAGE_ORDER`; preview 3 cards / page 25 on selected stage (`PIPELINE_STAGE_PREVIEW_SIZE`, `PIPELINE_PAGE_SIZE`).  
**CODE FACT:** Stage transitions happen on **lead detail** (`MoveStageForm`), not on the board.

### Dataset

Same ownership rules as Leads; partitioned by `Lead.stage`; includes WON/LOST columns.

### Actions

- Expand stage / Ver todos / pagination  
- Abrir lead  
- Link “Ver lista” → Leads  
- Empty → cadastrar lead

### Lifecycle Meaning

Pipeline represents **lead commercial stage lifecycle** (CRM stages on `Lead`), **not** a separate opportunity object.

**PRODUCT INFERENCE:** It is “where is this lead in the sales process?” vs Fila “what should I do next?” vs Inteligência “what is highest score?”.

### Disposition signal

**KEEP AS SECONDARY** (frequent for stage overview; not the post-auth landing). Distinct job from Fila — **JUSTIFIED** separate surface.

---

## Capability Overlap Matrix

| Capability | Fila | Leads | Inteligência | Pipeline | Overlap class |
|------------|------|-------|--------------|----------|---------------|
| View lead | Y | Y | Y | Y | JUSTIFIED (shared detail) |
| Search | N | N | N | N | — (gap) |
| Filter | Work buckets | N | Score/source | Stage (URL) | JUSTIFIED different axes |
| Sort | Fixed priority | createdAt desc | Score desc | createdAt in stage | JUSTIFIED |
| Score display | Badge | N | Hero | Optional on card | QUESTIONABLE duplication of score UX |
| Signals | N (detail) | N | Preview | N | JUSTIFIED on intel |
| Qualification | Badge | N | Badge + filter | N | JUSTIFIED |
| Contact (channel) | Via detail | Via detail | Via detail | Via detail | JUSTIFIED (single detail) |
| Register activity | Deep-link | Via detail | Via detail | Via detail | JUSTIFIED; fila shortcuts best |
| Follow-up urgency | Core | N | N | Label only | JUSTIFIED on fila |
| Stage change | Via detail | Via detail | Via detail | Via detail | JUSTIFIED |
| Ownership display | Implicit (mine) | N in table | N | N | Leads gap for ADMIN |
| Create lead | Empty CTA | Primary CTA | N | Empty CTA | JUSTIFIED on Leads |
| Discard/LOST | Via detail | Visible in list | Possible | Visible | JUSTIFIED |
| History | Detail | Detail | Detail | Detail | JUSTIFIED |
| Weekly carteira | Banner | N | N | N | JUSTIFIED on fila |
| Terminal stages | Excluded | Included | Included | Included | JUSTIFIED |

**Redundant risk:** Fila vs Inteligência both act as “pick a lead to work” — different sort keys (urgency vs score). Overlap is **QUESTIONABLE** if both stay top-level with confusing names; **JUSTIFIED** if Inteligência is clearly “score mode”.

---

## Navigation Analysis

**CODE FACT** (`nav-config.ts`):

| Group | Items |
|-------|-------|
| (none) | Visão geral |
| Operação | Minha fila, Inteligência, Pipeline |
| Base comercial | Leads, Demos |
| Gestão | Aquisição, Revisão HIGH, Equipe (ADMIN) |

Mobile primary: Fila | Inteligência | Pipeline | Mais (Leads buried under Mais).

**PRODUCT INFERENCE:** Navigation mixes **jobs** (Operação) with **artifacts** (Base comercial). Close to user mental model for daily work, but “Inteligência” breaks clarity.

Does navigation reflect jobs or modules? **Mostly jobs for Operação**; Leads is module/inventory; Inteligência is a poorly named job (prioritize by score).

---

## Entry Point Analysis

| From | To |
|------|-----|
| Login MEMBER | `/app/my-leads` |
| Login ADMIN | `/app` (dashboard) → CTA fila / equipe / HIGH |
| Dashboard operator CTA | `/app/my-leads` |
| Sidebar / mobile | four surfaces + more |
| Pipeline “Ver lista” | `/app/leads` |
| Intelligence empty | `/app/my-leads` |
| Queue / intel / pipeline / leads rows | `/app/leads/[id]?from=…` with return crumbs |
| Activity form default return | `/app/my-leads` |
| High-pool | `/app/leads/[id]` (no `from` origin) |

**Dead ends / friction:**

- After HIGH pool review, return path weaker than operational origins.  
- Leads not on mobile primary — create flow requires Mais → Leads → Novo.  
- Circular: Pipeline ↔ Leads (“ver lista”) without elevating create into Operação.

No forced sidebar loop for the CORE path fila → detail → register → return fila (**CODE FACT** breadcrumbs/`returnHref`).

---

## Role Analysis

| Role | Daily entry | List scope | Special |
|------|-------------|------------|---------|
| **MEMBER** | Minha fila | Own leads everywhere | Carteira if `canRunAcquisition`; no Aquisição FREE_PULL nav |
| **ADMIN** | Visão geral (team KPIs) | Global on Leads/Intel/Pipeline; **own** fila only | Equipe, HIGH pool, Aquisição |

**RECOMMENDATION:** Keep shared nav labels; do not invent personas. Optional later: ADMIN default emphasis on gestão; MEMBER already correct.

Navigation need not fully fork by role beyond current ADMIN-only items.

---

## Source-of-Truth Analysis

| Concept | Source of truth | Presentation |
|---------|-----------------|--------------|
| Stage | `Lead.stage` | Badges; pipeline columns; move form |
| Owner | `Lead.ownerId` | Detail; assignments also track weekly assignee |
| Score / qualification | `Lead.intelligence` JSON (+ derive from score) | Intel inbox; fila badge; detail card |
| Contact happened | `Activity` WHATSAPP/EMAIL | Timeline; fila “sem contato” uses latest non-STAGE activity |
| Next step | `Lead.nextFollowUpAt` + outcome rules | `getNextAction` |
| Weekly carteira progress | `LeadAssignment` + `WeeklyPortfolio` | Banner; dashboard KPIs |
| Treated this week | Assignment `TREATED` + activity link | KPIs / banner — **not** the same as stage CONTACTED |

**Inconsistency (document only):** “Qualificado” stage (`QUALIFIED`) ≠ intelligence “Prioridade alta” (HIGH). Same Portuguese family, different concepts — **naming collision risk** if Inteligência were renamed “Qualificação”.

---

## Current IA Problems

1. **Four open-lead entry points** without a one-sentence job card per nav item.  
2. **“Inteligência” mislabels** a score inbox (**CODE FACT** page meta contradicts nav jargon).  
3. **Leads thin** for “Base comercial” role.  
4. **Fila H1 ≠ nav label.**  
5. **Score urgency vs follow-up urgency** compete without explicit mode framing.  
6. **ADMIN global vs own fila** asymmetry is correct but undocumented in UI.  
7. Product freeze already picked CORE = fila + detail — nav still equal-weights three operação items.

---

## Surface Disposition

| Surface | Disposition | Evidence |
|---------|-------------|----------|
| **Minha fila** | **KEEP AS PRIMARY** | postAuth MEMBER; product.md CORE; dashboard CTAs; mobile #1 |
| **Pipeline** | **KEEP AS SECONDARY** | Distinct stage job; ADR pipeline; includes terminals |
| **Leads** | **KEEP AS SECONDARY** | Create + inventory + ADMIN global; thin but necessary until create moves |
| **Inteligência** | **RENAME CANDIDATE** (+ keep secondary) | Real job = score priority; label fails; H1 already better |

No **REMOVE** without Option B embedding.  
No **MERGE** forced in F3 — Options below.

---

## Target IA — Option A (recommended)

**Navigation (Operação):**  
Minha fila · **Prioridades** (was Inteligência) · Pipeline  

**Base comercial:** Leads · Demos  

### Mental model

“Trabalho do dia → priorizar por score → ver funil → inventário/cadastro.”

### Advantages

- Preserves all jobs  
- Lowest migration cost (label + copy)  
- Aligns nav with page H1 intent  
- Honors product CORE freeze  

### Disadvantages

- Still three operação list surfaces  
- Score vs urgency dual entry remains  

### Migration cost / risk

**Low / Low** — route `/app/intelligence` can stay; rename label + maybe H1 sync; e2e/nav tests.

---

## Target IA — Option B

**Navigation:** Minha fila (with score/priority mode or filter) · Pipeline · Leads  

Embed intelligence filters/sort into Fila; retire top-level Inteligência (redirect).

### Mental model

“One work list with urgency default and score mode.”

### Advantages

- Fewer operação items  
- Resolves dual “pick a lead” surfaces  

### Disadvantages

- Higher UX/engineering cost  
- Mixes two sort philosophies in one screen  
- Mobile nav redesign  

### Migration cost / risk

**Medium–High / Medium** — redirects, badge semantics, filter URL design, training.

---

## Target IA — Option C

**Navigation:** Minha fila · Pipeline  

Fold Leads create into Fila/Pipeline empty/CTAs; fold score into Fila; Leads becomes admin-only or hidden.

### Mental model

“Only work queue + funnel.”

### Advantages

- Maximum simplification  

### Disadvantages

- Loses clear inventory/ADMIN global list  
- Conflicts with current “Base comercial” and create flows  
- Violates least-change principle while Leads still owns create  

### Migration cost / risk

**High / High** — not recommended for next phase.

---

## Recommended Target IA

**Option A.**

| Item | Target |
|------|--------|
| Daily primary | Minha fila |
| Score inbox | Keep route; **rename nav/breadcrumb to Prioridades** (or Oportunidades); align H1 |
| Stage overview | Pipeline (unchanged role) |
| Inventory + create | Leads (secondary; capability later) |
| Detail | Unchanged hub for contact/activity/stage |

**Do not** remove surfaces solely to shorten the sidebar.

---

## Migration Impact

| Change | Impact |
|--------|--------|
| Rename Inteligência → Prioridades | nav-config, more page, breadcrumbs labels, e2e, docs |
| Keep `/app/intelligence` path | Low breakage |
| Fila H1 unify to “Minha fila” | Copy-only |
| Option B later | Larger; needs product-grill |

No schema/API/authz changes required for Option A.

---

## Risks

| Risk | Mitigation |
|------|------------|
| “Prioridades” confuses with pipeline QUALIFIED | Prefer **Prioridades** + meta “por score”; avoid “Qualificação” |
| Users lose Inteligência bookmark name | Redirect same URL |
| Over-merging (Option B/C) mid-pilot | Respect SCREEN MAP FREEZE; grill before merge |

---

## Unknowns

1. Operator preference: urgency-first vs score-first in daily practice (needs Sprint 0 evidence).  
2. Whether ADMIN needs a team queue (not own-only) — not implemented.  
3. Volume of leads without intelligence (fila-only) vs with (dual appearance).  
4. Whether LOW should be a first-class filter on Prioridades.

---

## Recommended F4

**F4 — Minha fila density + work-queue UX** (screen redesign of PRIMARY surface), with **optional small F3.1 rename** of Inteligência → Prioridades as a separate micro-PR if desired before density work.

F4 should **not** redefine IA; it should densify Fila under Option A.

If rename is bundled: touch only labels/tests — still not a visual redesign of intel cards.

---

## Evidence Index

- `prisma/schema.prisma` — Lead, Activity, LeadAssignment, WeeklyPortfolio  
- `src/server/repositories/lead.repository.ts` — queue / intel / pipeline / list queries  
- `src/server/services/lead.service.ts` — getMyQueueForOwner, getIntelligenceInbox, getPipelineView  
- `src/server/auth/lead-access.ts` — MEMBER owner scope; ADMIN all  
- `src/server/auth/login-redirect.ts` — MEMBER → my-leads  
- `src/features/leads/my-queue.ts` — buckets/sort/filters  
- `src/features/leads/intelligence/inbox.ts` — score inbox projection  
- `src/features/leads/intelligence/qualification.ts` — score thresholds  
- `src/components/navigation/nav-config.ts` — groups + mobile  
- `src/features/dashboard/dashboard.view.ts` — CTAs to fila  
- `docs/product.md` — CORE = Minha fila + detalhe  
- `docs/adr/0002-pipeline-lead-activity-v1.md` — stage/activity truth  
- `docs/product/product-decision-mvp-technical.md` — vertical flow  

---

## Closure

F3 IA audit complete. **No UI implementation. No business logic changed. No commit.**
