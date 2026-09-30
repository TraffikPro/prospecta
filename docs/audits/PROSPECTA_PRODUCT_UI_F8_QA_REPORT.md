# F8 — Authenticated Runtime QA & Integration Gate

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Working tree:** F1–F7 Product UI V2 changes preserved (dirty); F8 fixes applied in-place; **no commit / no push**.

## Executive Result

Authenticated local QA was restored. F4–F7 were rendered at desktop / medium / mobile viewports with real seed + fixture data. Relevant E2E specs were executed. Two verified F4–F7 integration defects were fixed and re-validated.

**Gate decision: PASS WITH DEBT**

## Runtime Environment

| Item | Value |
| --- | --- |
| Mode | `npm run dev` (Next.js 16 Turbopack) on `http://127.0.0.1:3000` |
| Database | Local Docker Postgres `127.0.0.1:5433` / db `prospecta` |
| DB fingerprint | `f51e39483f1d` (not production `50218bdd86d8`) |
| Rate limit | Memory adapter (Upstash env cleared for the process so Next does not refill from `.env`) |
| Auth users | Seeded `admin@prospecta.test` / `comercial@prospecta.test` with E2E default passwords |
| Production | **Not modified** (`.env` Neon URL left untouched; process overrides only) |

## Authentication Blocker Investigation

Previous phases could render login chrome but authenticated local QA failed with a generic message matching rate-limit unavailable copy.

Evidence collected:

1. `.env` `DATABASE_URL` host fingerprint = **`50218bdd86d8`** (production Neon guard fingerprint).
2. Upstash Redis REST URL/token + `RATE_LIMIT_KEY_SECRET` are present in `.env`.
3. Under `next start` / production-like assumptions, login policies are **fail-closed** when the distributed store is unavailable → user-facing *"Não foi possível concluir agora…"*.
4. Playwright / README expect **`pnpm`/`npm` `dev`** against local Docker `:5433`, not production Neon.
5. Seed only creates fictional `@prospecta.test` users; E2E defaults are `AdminTest123!` / `MemberTest123!` (distinct from whatever `SEED_*` values live in `.env`).

## Root Cause

**CONFIGURATION / MISSING LOCAL BINDING** (not an auth-code defect):

- Process was bound to **production Neon** via `.env` `DATABASE_URL`.
- Upstash was loaded from `.env`; when that store path fails or conflicts with local assumptions, login fail-closes.
- Seed passwords in `.env` did not match Playwright defaults, which would also block E2E even after DB correction.

Class: **CONFIGURATION DEFECT** + **MISSING LOCAL DATABASE BINDING FOR QA SESSION**.

## Resolution / Remaining Blocker

**Resolved for this F8 session** without weakening production auth:

1. Session override: `DATABASE_URL=postgresql://prospecta:prospecta@127.0.0.1:5433/prospecta`.
2. Empty-string overrides for `UPSTASH_*` / `RATE_LIMIT_KEY_SECRET` / `VERCEL_ENV` so Next.js does not refill them from `.env`.
3. `prisma migrate status` → local schema up to date; `prisma db seed` + explicit password verify for E2E defaults.
4. Visual fixture leads inserted via guarded local script (fingerprint-checked).
5. App started with `npm run dev -- --hostname 127.0.0.1 --port 3000`.
6. Manual login as MEMBER succeeded → `/app/my-leads`.

**Remaining human/env debt:** local developer workflows should not rely on a `.env` that points at production Neon for day-to-day QA. Prefer documented local Docker URL (or `.env.local` override owned by the human). Agent did **not** rewrite `.env` secrets.

## Test Data

| Source | Notes |
| --- | --- |
| `prisma/seed.ts` | 3 fictitious users |
| Local visual fixture | Multiple stages, scores, Places evidence, overdue follow-up, long names |
| E2E helpers / UI create | Additional leads during suite run |
| Local DB scale | ~270–295 leads (unbounded inventory/queue) |

## E2E Execution

**Command (primary suite):**

```text
npx playwright test \
  e2e/auth.spec.ts \
  e2e/my-leads.spec.ts \
  e2e/leads.spec.ts \
  e2e/intelligence-inbox.spec.ts \
  e2e/pipeline.spec.ts \
  e2e/breadcrumbs.spec.ts \
  e2e/portfolio.spec.ts \
  e2e/nav-badges.spec.ts \
  --reporter=list
```

**Initial result:** 21 passed / 3 failed / 0 skipped (under concurrent visual browsing load).

| Spec | Result | Classification |
| --- | --- | --- |
| `auth` login HttpOnly | FAIL then **PASS** on isolated re-run | ENVIRONMENT / FLAKY (cold load + concurrent QA); not product regression |
| `leads` inventory search | FAIL then **PASS** after fix | PRODUCT a11y label mismatch (F5) |
| `pipeline` stage move | FAIL then **PASS** after fixes | PRODUCT + TEST (duplicate testid + link name) |
| Remaining listed specs | PASS | — |

**Isolated re-runs after fixes:** auth HttpOnly PASS; leads search PASS; pipeline suite 2/2 PASS.

## Minha Fila QA

Product question: *Can I immediately see what needs my action now?* → **Yes.**

Observed:

- Heading + urgency copy; filter chips with counts; sections `Atrasados` / `Sem contato` / `Demais`.
- Dense rows (~90px desktop); company identity; stage; score·priority; action hint; Registrar / Abrir.
- Mobile: stacked actions, bottom nav `Fila · Prioridades · Pipeline · Mais`, no horizontal overflow.
- Weekly carteira banner absent for this MEMBER session (`eligibleOperator` false) — expected, not a regression.
- Unbounded DOM with ~270 queue items → very tall page (known scale debt).

## Leads QA

Product question: *Can I quickly find a lead?* → **Yes** (after label fix).

Observed:

- Count, search, stage filter, table density, score/stage/source/created, `+ Novo Lead`.
- MEMBER: no owner filter (correct). ADMIN: owner filter present.
- Search by company works; no-results state works; clear filters present.
- Mobile rows / filter stacking OK; no horizontal overflow.
- Unbounded ~295 rows (known debt).

## Prioridades QA

Product question: *Can I understand where the strongest potential is and why?* → **Yes.**

Observed:

- Distinct from Leads / Fila: score column, ≤3 signals, diagnostic / Places evidence, qualification + source filters.
- Ranking readable; route remains `/app/intelligence` with user-facing **Prioridades**.
- Mobile dense enough; no overflow.
- Unbounded list (known debt).

## Pipeline QA

Product question: *Can I understand where opportunities are in the lifecycle?* → **Yes.**

Observed:

- Stage accordion order with counts; selected stage paginated (`PAGE_SIZE=25`); non-selected preview size 8.
- Compact rows: company, score, source, follow-up / LOST reason when present.
- WON/LOST present as terminal stages; empty stages handled.
- Mobile accordion usable; no horizontal overflow.

## Cross-Surface Consistency

| Concern | Result |
| --- | --- |
| Heading hierarchy / PageFrame | Consistent |
| Control height (`minH=touch`) | Consistent |
| Score treatment | Contextual (muted in Fila/Leads; primary in Prioridades; light in Pipeline) |
| Stage treatment | Contextual (urgency vs inventory badge vs lifecycle accordion) |
| Empty / loading | Present where exercised |
| Differentiation | Surfaces do **not** collide visually |

## Navigation / Shell

- Sidebar: Prioridades (not Inteligência), Demos (not Portfólio).
- ADMIN: Gestão → Aquisição, Revisão HIGH, Equipe.
- MEMBER: no Aquisição/Equipe in primary nav.
- Mobile bottom nav labels correct.
- Breadcrumbs E2E PASS (including intelligence/pipeline origins).

## Lead Detail Regression

| Origin | Result |
| --- | --- |
| Minha fila → Abrir | PASS (`?from=my-leads`) |
| Leads inventory search → open | PASS |
| Prioridades row | PASS (`?from=intelligence`) |
| Pipeline row | PASS (`?from=pipeline`) |

Lead Detail itself **not redesigned** (debt remains for a later phase).

## Responsive QA

All four primary surfaces checked at ~1440 / ~900 / ~390. **No horizontal overflow** measured. Mobile actions remain reachable. Unbounded vertical length is the main responsive scale issue (debt).

## Accessibility Regression QA

- Tab / semantic links / buttons present on primary surfaces.
- Filter labels present; Leads search accessible name corrected to **Buscar leads**.
- Pipeline lead links now expose `aria-label={companyName}` (name no longer polluted by score/source text).
- Status uses text + chrome, not color-only (urgency stripe accompanies copy).
- Accordion keyboard behavior inherited from Chakra (not separately audited end-to-end).
- Full WCAG audit: **not claimed**.

## Console / Runtime Findings

| Finding | Severity | Notes |
| --- | --- | --- |
| next-themes / ColorModeProvider hydration mismatch | MEDIUM | Pre-existing shell issue (`ThemeProvider` script vs Emotion style) |
| Pipeline emotion className hydration under concurrent E2E writes | LOW | Observed while suite mutated same DB; not reproduced as stable product bug |
| SVG `height="auto"` warning on login art | LOW | Auth chrome; out of F8 redesign scope |
| favicon 404 | LOW | Cosmetic |
| MaxListenersExceededWarning on Gzip during heavy local traffic | LOW | Dev noise under concurrent load |

## Performance Sanity

- Minha fila / Leads / Prioridades render **unbounded** lists → multi‑10k px documents with hundreds of rows.
- Pipeline uses counts + preview/page architecture (acceptable).
- No infinite render loops observed.
- Pagination **not** implemented in F8 (per brief); scale debt remains.

## Defect Log

| ID | SURFACE | VIEWPORT | SEVERITY | OBSERVED | EXPECTED | ROOT CAUSE | ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | Auth runtime | — | BLOCKER (session) | Login failed against Neon + Upstash path | Local authenticated QA | Config binding to prod DB / Upstash | Session overrides + local seed; documented |
| D2 | Leads | all | HIGH | `getByLabel('Buscar leads')` failed; accessible name was `Busca` | Label matches E2E/product copy | `aria-labelledby` text ≠ `aria-label` | Fixed toolbar label; removed conflicting `aria-label` |
| D3 | Pipeline | desktop E2E | HIGH | `pipeline-stage-NEW` strict-mode duplicate; link name included Score/source | Stable desktop locator; company name | Dual desktop/mobile DOM + compact row a11y name | Scoped E2E; `aria-label` on lead link |
| D4 | Auth E2E | — | LOW | One HttpOnly login timeout under concurrent load | Stable login | ENVIRONMENT/FLAKY | Re-ran isolated → PASS; no code change |
| D5 | Shell | all | MEDIUM | Hydration warning from ColorModeProvider | Clean hydrate | next-themes + Emotion (pre-existing) | Documented; not fixed in F8 |
| D6 | Fila/Leads/Prioridades | all | MEDIUM | Extremely tall unbounded DOM | Acceptable pilot density / later pagination | Known unbounded lists | Debt only |

## Fixes Applied

1. `src/features/leads/components/lead-inventory-toolbar.tsx` — visible/accessible label **Buscar leads**; clearer placeholder.
2. `src/features/pipeline/components/lead-stage-card.tsx` — `aria-label={companyName}` on lead link.
3. `e2e/pipeline.spec.ts` — assert `pipeline-desktop` scoped stage testid.

No business logic, schema, auth weakening, navigation concepts, or speculative redesign.

## Screenshots

Persisted under `docs/product/assets/ui-v2/`:

- `minha-fila-{desktop,medium,mobile}.png`
- `leads-{desktop,medium,mobile}.png`
- `prioridades-{desktop,medium,mobile}.png`
- `pipeline-{desktop,medium,mobile}.png`

## E2E Matrix

| Area | Automated E2E | Manual visual |
| --- | --- | --- |
| AUTH | PASS (after isolated re-run) | PASS |
| NAV | PASS | PASS |
| FILA | PASS | PASS |
| LEADS | PASS (after fix) | PASS |
| PRIORIDADES | PASS | PASS |
| PIPELINE | PASS (after fix) | PASS |
| LEAD DETAIL | PASS via breadcrumbs + origin opens | PASS (open only; no redesign) |

## Visual QA Matrix

| Surface | Desktop | Medium | Mobile |
| --- | --- | --- | --- |
| Minha fila | PASS | PASS | PASS |
| Leads | PASS WITH FIX | PASS WITH FIX | PASS WITH FIX |
| Prioridades | PASS | PASS | PASS |
| Pipeline | PASS WITH FIX | PASS | PASS |

## Remaining Product Debt

- Lead Detail UX not part of F4–F7 polish (still heavier / older patterns).
- Equipe / Auth / Demos redesign explicitly deferred (F9+ candidates).
- Weekly carteira strip only when operator is eligible — empty/non-eligible state is quiet (acceptable; optional copy later).
- Subjective polish of Lead Detail / dashboard not in scope.

## Remaining Technical Debt

- Leads / Prioridades / Minha fila **unbounded** fetches and DOM.
- ColorMode / next-themes hydration warnings.
- Local `.env` still points at production Neon fingerprint — risky if someone runs mutable scripts without overrides.
- Dual Pipeline desktop/mobile DOM keeps duplicate `pipeline-stage-*` testids (tests must scope).
- Login SVG / favicon noise.

## Gate Decision

**PASS WITH DEBT**

Authenticated visual verification of F4–F7 succeeded. High defects introduced/exposed by the V2 work were fixed and re-checked. Scale/pagination and shell hydration remain debt, not gate blockers for Product UI V2 core.

## Recommended F9

1. **Lead Detail** coherence pass (presentation only) aligned with F2–F7 density language.  
2. **Pagination / virtualization** technical phase for Leads + Prioridades (+ optionally Minha fila).  
3. **Local env hygiene** doc: require Docker `:5433` + empty Upstash for `dev` (without weakening prod).  
4. Optional: ColorMode hydration cleanup.  
5. Do **not** start Equipe / Auth / Demos redesign until Lead Detail or pagination priority is chosen.

---

**Environment declaration**

- Ambiente utilizado: local Docker Postgres + `next dev` on loopback.  
- Operações mutáveis: local seed users + local fixture leads + E2E-created leads on `:5433` only.  
- Migrations aplicadas: nenhuma nova (schema already up to date locally).  
- Serviços externos alterados: nenhum.  
- Produção: **não modificada**.
