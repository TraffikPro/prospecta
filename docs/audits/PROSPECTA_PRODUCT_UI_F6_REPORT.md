# F6 — Prioridades / Decision Support

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Route:** `/app/intelligence` (user-facing **Prioridades**)  
**Business logic changed:** NO

---

## Product Responsibility

**Prioridades answers:** “Onde existe maior potencial e por quê?”

| Surface | Job |
|---------|-----|
| Minha fila | Urgency / next action |
| Leads | Inventory find |
| Prioridades | Score + evidence ranking |
| Pipeline | Stage lifecycle |

Copy on the page points action-of-day work back to Minha fila.

---

## Dataset

Verified:

| Rule | Behavior |
|------|----------|
| Eligibility | Parseable intelligence with **numeric score** + resolvable qualification |
| MEMBER | Own leads (`listLeadsWithIntelligence` + owner scope) |
| ADMIN | All leads |
| Stages | **No stage cut** (WON/LOST can appear) |
| Sort | Score desc, then company name |
| Invalid / unscored | Excluded from list (unchanged) |

---

## Intelligence Data Model

| Field | Class | Notes |
|-------|-------|-------|
| `score` | STRUCTURED | 0–100 finite; persisted JSON |
| `qualification` | STRUCTURED / DERIVED | Explicit or from score bands |
| `signals[]` | STRUCTURED | Canonical codes + aliases |
| `diagnostic` / legacy `summary` | FREE TEXT | Reason line |
| `pitch` | FREE TEXT | Outreach copy — **not** shown on Prioridades rows |
| `campaign` | STRUCTURED | Available; not primary on row |
| `rating` / `reviews` | SOURCE DATA | Places facts |
| `googleMapsUrl` | SOURCE DATA | Detail-oriented |
| Freshness timestamp | UNKNOWN | **Not in payload** |

---

## Score Origin

- **Persisted** on `Lead.intelligence` (external generator / Places pipeline).
- **Not recomputed** in the Prospecta app on read.
- Scale **0–100**; invalid outside range → parse drop.
- Bands (existing): `≥70` HIGH, `≥50` MEDIUM, else LOW (`qualificationFromScore`).
- Prefer explicit `qualification` when present.
- Staleness: **no generation timestamp** in JSON → cannot show freshness.

**F6 did not change scoring or generation.**

---

## Explainability

**Status: PARTIAL**

Supported evidence surfaced:

1. Up to **3 signal labels** (catalog: website, rating, reviews, …)
2. Truncated **diagnostic** (not pitch)
3. Compact Places line when `rating` / `reviews` exist

If only score exists: “Score disponível — critérios detalhados no lead.”

**No fabricated claims** (ICP, buying intent, etc.).

Helper: `buildPriorityEvidence`.

---

## Previous Presentation

- Card-first `LeadScoreCard` with large score, badges, pitch dump
- Felt closer to “score gallery” than decision support
- Meta still action-oriented (“contate e registre”)

---

## New Presentation

Dense **ranked list rows**:

Score + qualification  
→ Company · stage · owner (ADMIN)  
→ Signals · diagnostic · Places facts  
→ Source  

Primary navigation: entire row → lead detail (`from=intelligence`).

No ordinal `#1` (misleading with filters/ties).  
No gauges / glow / card grid.

---

## Information Hierarchy

| Priority | Content |
|----------|---------|
| P1 | Score, qualification, company, signals/diagnostic |
| P2 | Stage, Places facts, source, owner (ADMIN) |
| P3 | Pitch, full intelligence card → Lead Detail |

---

## Score Treatment

Compact `xl` numeric score + qualification text (existing labels). Stronger than Fila/Leads, without gauges.

---

## Signals / Reasons

Text joined with ` · ` (readable evidence, not chip soup). Max 3 signals.

---

## Filters

Preserved (prioritization-relevant):

| Filter | Question |
|--------|----------|
| Qualificação HIGH/MEDIUM | “Show only high / mid bands?” |
| Origem Places/Manual | “Limit by intelligence source?” |

Label rename: filter group **Qualificação** (was “Score”).  
No Leads-style search / owner filter / urgency filters.

---

## Actions

Single primary: open lead. No multi-CTA clutter.

---

## ACL

| Role | List | Owner on row |
|------|------|--------------|
| MEMBER | Own scored leads | Hidden |
| ADMIN | All scored leads | Shown |

---

## Empty / Invalid Intelligence

| Case | Behavior |
|------|----------|
| Unparseable / no score | Excluded (unchanged) |
| Empty after filter | Distinct empty + limpar |
| Empty inventory | Explains score requirement + link Minha fila |

---

## Freshness

**DATA GAP** — no reliable intelligence timestamp.

---

## Responsive

Column stack on narrow screens; score block first; evidence wraps.

---

## Accessibility

- Score `aria-label` (“Score N de 100”)
- Semantic link wrapping row
- Meaning not color-only (numeric + text labels)
- Touch-friendly row height

---

## Data Gaps

| Gap | Notes |
|-----|-------|
| EXPLAINABILITY beyond signals/diagnostic | No structured “reason weights” |
| Freshness | No timestamp |
| Unbounded list | Same scale risk as before (document; not fixed in F6) |
| Authenticated visual QA | Still blocked |

---

## Query / Performance

Unchanged pattern: `listLeadsWithIntelligence` → pure `buildIntelligenceInbox`.  
Evidence built in UI from payload already loaded (no extra queries, no AI calls).

---

## Files Changed

- `src/features/leads/intelligence/priority-evidence.ts` (+ test)
- `src/features/leads/intelligence/inbox.ts` (+ stage/owner on items)
- `src/features/leads/intelligence/inbox.test.ts`
- `src/features/leads/intelligence/index.ts`
- `src/features/leads/components/intelligence/lead-score-card.tsx`
- `src/features/leads/components/intelligence/intelligence-filters.tsx`
- `src/app/(authenticated)/app/intelligence/page.tsx`
- `src/app/(authenticated)/app/intelligence/loading.tsx`
- `e2e/intelligence-inbox.spec.ts`

---

## Tests

- Inbox sort/filter/skip incomplete + stage/owner projection
- `buildPriorityEvidence` signals/diagnostic/places; excludes pitch
- E2E: signals assertion + row link (not executed this session)

---

## Validation

See stop report (typecheck / lint / unit / build).

---

## Visual Verification

**AUTHENTICATED VISUAL QA STILL BLOCKED** (F4/F5 debt).  
F4 Minha fila, F5 Leads, F6 Prioridades — not visually verified authenticated.

---

## Remaining Debt

- Authenticated visual QA (F4–F6)
- Leads pagination (F5)
- Prioridades unbounded retrieval
- Intelligence freshness field (product/generator)

---

## Recommended F7

**Pipeline commercial stage overview** — denser stage columns and clearer terminal stages, without absorbing Fila / Prioridades / Leads jobs.
