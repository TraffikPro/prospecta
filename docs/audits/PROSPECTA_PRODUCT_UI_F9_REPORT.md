# F9 — Lead Detail / Operational Record

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Working tree:** F1–F8 Product UI V2 preserved (dirty) + F9 Lead Detail presentation; **no commit / no push**.  
**Business logic changed:** **NO**

---

## Product Responsibility

**Lead Detail answers:** “What do I know about this lead, what has happened, and what can I do next?”

It is the **operational record** shared by Minha fila, Leads, Prioridades, and Pipeline — where context becomes action.

| Surface | Job |
| --- | --- |
| Minha fila | What needs my action now? |
| Leads | Which leads exist and how do I find one? |
| Prioridades | Where is the highest potential and why? |
| Pipeline | Where are leads in the commercial lifecycle? |
| **Lead Detail** | **Identity → stage → relevance → history → next action** |

---

## Current Capability Map

| Area | Implementation |
| --- | --- |
| Route | `src/app/(authenticated)/app/leads/[id]/page.tsx` |
| Layout | `LeadDetailLayout` — desktop ~65/35 main + sticky operational rail; mobile order next → contact → stage → history/activity/intelligence |
| Identity header | `LeadInfoCard` — company h1, optional contact name, stage + source badges, compact DataList (score, owner, email, phone), WON/LOST alerts |
| Next action | `LeadNextActionCard` + `getNextAction` / follow-up label |
| Contact | `LeadContactActions` — WhatsApp handoff (`wa.me`), mailto, link to `#register-activity` |
| Stage | `MoveStageForm` → `moveLeadStageAction` → `moveLeadStage` (server) |
| Activity | `ActivityTimeline` (newest-first) + `CreateActivityForm` |
| Intelligence | `IntelligenceCard` / `LeadIntelligenceFallback` + commercial playbook section |
| Origin / crumbs | `leadBreadcrumbItems` + `ContextualNav` / mobile context back via `?from=` + `?filter=` |
| Ownership | MEMBER: own leads only (`forbidden` if other owner); ADMIN: all + optional `LeadReassignForm` |
| ACL / not-found | Auth redirect; `notFound()` if missing; `forbidden()` for MEMBER cross-owner (no existence leak beyond ACL) |
| Score | Persisted JSON intelligence; bands ≥70 HIGH / ≥50 MEDIUM (F6) |

---

## Domain Information Map

| Domain | Available fields (actual) |
| --- | --- |
| IDENTITY | `companyName`, `contactName` |
| COMMERCIAL STATE | `stage`, terminal WON/LOST, `lostReason` |
| CONTACT | `email`, `phone`, `website` (origin/playbook) |
| INTELLIGENCE | score, qualification, signals, diagnostic, pitch, rating/reviews, maps URL |
| ACTIVITY/HISTORY | type, outcome, body, author, createdAt; STAGE_CHANGE summaries |
| OWNERSHIP | `owner.name`, `owner.email`; ADMIN reassign |
| SOURCE | `source` badge (e.g. Google Places / Manual) |
| FOLLOW-UP | `nextFollowUpAt` + next-action urgency labels |
| ACTIONS | register activity, contact channels, change stage, ADMIN reassign |
| SYSTEM METADATA | notes (sanitized), origin details |

**Not invented:** deal value, forecast, AI chat, new activity types, new scoring.

---

## Previous Presentation

- Functional Fatia A layout already present, but denser “card stack” feel.
- Header carried more field-grid weight; WON/LOST less explicit as terminal banners.
- Intelligence nested as heavier card chrome; score presentation competed with record work.
- Pitch expand relied on conditional unmount → flaky E2E when text left the DOM.
- Mobile order less aligned to “act first, history second”.

---

## New Information Hierarchy

### P1 — needed to work the lead now

Company identity · stage · next action · contact channels · register activity · recent history

### P2 — useful commercial context

Score/qualification (compact) · signals · diagnostic · Places evidence · pitch (labeled suggestion) · follow-up due · owner (esp. ADMIN)

### P3 — secondary / system

Source badge · website/notes origin block · playbook supporting copy · system-empty intelligence fallback

**Initial viewport:** identity + stage + next action + contact (rail / mobile top). History and intelligence follow without forcing a field scan.

---

## Header / Identity

- **Company** is `h1` / `pageTitle`.
- Contact name is secondary meta when present.
- Stage + source badges stay compact beside the title.
- Score appears as `95 · Prioridade alta` in a horizontal DataList — not a gauge hero.
- Owner always shown (membership clarity); email/phone listed when present (action rail still owns channel CTAs).

---

## Commercial State

- Stage badge in header (`data-testid="lead-stage"`).
- Rail section **Alterar etapa** with select + **Salvar etapa**.
- Semantics unchanged: server validates transitions; LOST requires reason; WON/LOST terminal.

---

## Stage Transitions

| Item | Behavior (unchanged) |
| --- | --- |
| Action | `moveLeadStage` / `moveLeadStageAction` |
| Stages | `LEAD_STAGE_ORDER` (NEW → … → WON / LOST) |
| LOST | Reason required (server + form) |
| WON | Terminal; no invented revenue fields |
| Auth | Server-side ownership / role |
| UI change | Presentation only (surface border, heading hierarchy) |

**Behavior changed:** NO

---

## Contact

- Compact surface: Contatar (WhatsApp when phone valid), E-mail, Registrar resultado → `#register-activity`.
- Empty factual state when no channels.
- No new integrations.

---

## Activity / History

| Item | Choice |
| --- | --- |
| Presentation | Compact Chakra Timeline (not decorative graphics for empty data) |
| Order | Newest-first (existing service/workflow) |
| Empty | Factual empty + link to register |
| Register | Discoverable section `#register-activity`; single primary save in form |

Activity remains **contact truth** (F3).

---

## Follow-up

- Shown in next-action card (`Follow-up` label + urgency when not terminal).
- Timeline may surface next follow-up context when present.
- No task-manager invention.

---

## Intelligence

- Section **Qualificação do lead** with explicit meta: evidence supports approach; does not replace contact history.
- Score compact (`ScoreDisplay`); signals; Places evidence; diagnostic as prose.
- Missing intelligence → `LeadIntelligenceFallback` (factual, source-aware).

---

## Score

- Same bands as Prioridades (F6): ≥70 / ≥50.
- Header chip + compact intelligence block.
- Prioridades keeps comparison; Detail keeps record understanding.

---

## Pitch Decision

| Classification | SUPPORTING / ACTIONABLE for outreach |
| --- | --- |
| Label | **Sugestão de abordagem** — generated text, not objective fact |
| UX | Preview + expand (`type="button"`); full text always mounted (display toggle) for reliable copy/E2E |
| Retention | Kept on Detail (removed from Prioridades dump in F6) |

---

## Ownership / Source

- Owner in header DataList.
- ADMIN reassign form retained in stage rail stack.
- Source as badge (human labels), not raw implementation ids.

---

## WON / LOST

- **LOST:** error alert with existing `lostReason` (or factual “não informado”).
- **WON:** success alert — terminal state; no deal value invented.
- Next-action urgency suppressed when `isTerminal`.

---

## Action Hierarchy

| Class | Actions |
| --- | --- |
| PRIMARY | Register activity (form save); Contatar when channel exists |
| SECONDARY | E-mail; change stage save; pitch copy/expand; breadcrumb back |
| CONTEXTUAL | Registrar resultado anchor; empty-state register link |
| DESTRUCTIVE | None added (stage LOST is commercial terminal, not delete) |

Avoided five competing solid primaries in one viewport.

---

## Responsive

| Viewport | Behavior |
| --- | --- |
| Desktop (~1440) | Main column (history / activity / intelligence) + sticky operational rail when it fits |
| Medium (~900) | Single structured column; operational blocks first |
| Mobile (~390) | Identity → next → contact → stage → history/activity/intel; mobile context back |

No horizontal overflow observed in authenticated captures.

---

## Accessibility

- Heading hierarchy: page `h1`, section titles for next action / stage / history / intelligence.
- Stage select labeled via `aria-labelledby` / visually hidden label.
- Pitch toggle `aria-expanded` / `aria-controls`; `type="button"`.
- Status not color-only (WON/LOST titles + copy; stage badge text).
- Touch targets `minH="touch"` / `11` on primary controls.
- Focus target `#register-activity` with scroll margin.

---

## Origin Navigation

| Origin | Mechanism | Status |
| --- | --- | --- |
| Minha fila | `?from=my-leads` (+ `filter`) → breadcrumb / mobile back | PASS (E2E hardened vs unbounded DOM) |
| Leads | inventory / create → detail | PASS |
| Prioridades | `?from=intelligence` | PASS |
| Pipeline | `?from=pipeline` | PASS |

E2E avoids scroll-find through ~300-row Minha fila (known F8 scale debt); origin URL + crumb back still assert filter preservation.

---

## Data Gaps

- No reliable intelligence freshness timestamp (F6).
- Pitch is generated suggestion — labeled as such.
- Deal value / contract / forecast: **absent** (correctly not invented).
- Unbounded inventory/queue scale affects navigation E2E, not Detail schema.

---

## Files Changed (F9-focused)

Presentation / Detail:

- `src/app/(authenticated)/app/leads/[id]/page.tsx`
- `src/features/leads/components/lead-detail-layout.tsx`
- `src/features/leads/components/lead-info-card.tsx`
- `src/features/leads/components/lead-next-action-card.tsx`
- `src/features/leads/components/lead-contact-actions.tsx`
- `src/features/leads/components/lead-intelligence-fallback.tsx`
- `src/features/leads/components/intelligence/intelligence-card.tsx`
- `src/features/leads/components/intelligence/score-display.tsx`
- `src/features/leads/components/intelligence/pitch-box.tsx`
- `src/features/leads/move-stage-form.tsx`
- `src/features/activities/create-activity-form.tsx` (surface presentation alignment)
- `src/features/leads/intelligence/detail-presentation.test.ts` (new)

E2E hardening (unbounded fila debt):

- `e2e/breadcrumbs.spec.ts`
- `e2e/my-leads.spec.ts`

Evidence:

- `docs/product/assets/ui-v2/lead-detail-desktop.png`
- `docs/product/assets/ui-v2/lead-detail-medium.png`
- `docs/product/assets/ui-v2/lead-detail-mobile.png`

F1–F8 files remain dirty in the working tree by design.

---

## Tests

| Suite | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (pre-existing unused-var warning in unrelated smoke script) |
| `npm run test` (full node:test suite) | PASS — 358 |
| `detail-presentation.test.ts` | PASS (score bands) |
| `npm run build` | PASS |

---

## E2E

**Runtime:** F8 local QA — `next dev` @ `127.0.0.1:3000`, Docker Postgres `:5433`, empty Upstash overrides, seeded `@prospecta.test` users. Production Neon **not** used.

| Spec | Result |
| --- | --- |
| `e2e/breadcrumbs.spec.ts` (5) | PASS |
| `e2e/my-leads.spec.ts` | PASS |
| `e2e/lead-intelligence.spec.ts` | PASS |
| `e2e/leads.spec.ts` | PASS |
| `e2e/pipeline.spec.ts` | PASS |
| `e2e/intelligence-inbox.spec.ts` | PASS |
| `e2e/mobile-experience.spec.ts` | PASS |

**Regression path:** Fila / Leads / Prioridades / Pipeline → Lead Detail verified via the above.

---

## Visual QA

Authenticated MEMBER session; seeded high-score Places lead (`Prioridade Alta Places F8`).

| Viewport | Result |
| --- | --- |
| Desktop | Identity + stage clear; rail next/contact/stage; history empty state factual |
| Medium | Single column operational order coherent |
| Mobile | Context back to Prioridades; next/contact prioritized; no overflow |

Also exercised intelligence/pitch via E2E; WON/LOST via pipeline E2E + header alerts in code.

---

## Screenshots

- `docs/product/assets/ui-v2/lead-detail-desktop.png`
- `docs/product/assets/ui-v2/lead-detail-medium.png`
- `docs/product/assets/ui-v2/lead-detail-mobile.png`

---

## Remaining Product Debt

- Equipe / Auth / Demos redesign deferred.
- Subjective polish of Visão geral / admin surfaces not in scope.
- Commercial playbook section retained as supporting context — may deserve a later density pass without becoming AI theater.

---

## Remaining Technical Debt

Carried from F8 (+ F9 E2E notes):

- Leads / Prioridades / Minha fila **unbounded** fetches and DOM (~300+ MEMBER queue rows).
- Local `.env` may still point at production Neon fingerprint — use process overrides for QA.
- ColorMode / next-themes hydration warnings.
- Dual Pipeline desktop/mobile DOM / duplicate stage testids.
- Auth/login flake under heavy parallel suites (isolated runs OK).
- Favicon / SVG noise.
- Minha fila filter **soft-nav** under huge lists flakes in Playwright actionability — product links work; E2E uses `goto` + origin URLs until pagination.

---

## Recommended F10

1. **Pagination / virtualization** for Leads + Prioridades (+ Minha fila) — primary scale risk.
2. Local env hygiene doc (Docker `:5433` + empty Upstash for `dev`) without weakening prod auth.
3. Optional ColorMode hydration cleanup.
4. Do **not** start Equipe / Auth / Demos redesign until pagination priority is chosen.

---

## Environment declaration

- Ambiente utilizado: local Docker Postgres `127.0.0.1:5433` + `next dev` loopback.
- Operações mutáveis: E2E-created leads / activities on local DB only.
- Migrations aplicadas: nenhuma.
- Serviços externos alterados: nenhum.
- Produção: **não modificada**.

---

**F9 COMPLETE — NO F10 WORK STARTED. NO COMMIT. NO PUSH.**
