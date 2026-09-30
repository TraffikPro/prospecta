# F13 — Demos / Commercial Showcase

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Working tree:** F1–F12 preserved + F13 Demos gallery; **no commit / no push**.  
**Business logic changed:** **NO**

---

## Product Responsibility

**Demos answers:** “What can I show a prospect or client?”

Showcase surface inside the authenticated product — **not** operational CRM density (fila / leads / pipeline / equipe).

Route remains `/app/portfolio`. Internal `portfolio` / `WeeklyPortfolio` unchanged.

---

## Demo Inventory

| Name | Purpose | Route / asset | Preview | Action | Interactive |
| --- | --- | --- | --- | --- | --- |
| Clínica Sorriso | Clínica familiar — tratamentos + primeiro contato | `/portfolio/odontologia-familiar/index.html` | Typographic (no coverImage) | Abrir demo · Copiar link | Static HTML |
| Atelier Dental | Odontologia estética — procedimentos / agendamento | `/portfolio/odontologia-premium/index.html` | Typographic | Abrir demo · Copiar link | Static HTML |
| Dr. Consultório | Profissional individual — presença + contato | `/portfolio/odontologia-individual/index.html` | Typographic | Abrir demo · Copiar link | Static HTML |

**Classification:** commercial concept sites (sites-conceito) for dentistry niche — static public HTML, not live product workflows.

**Auth:** gallery requires ADMIN|MEMBER session; demo HTML is public static (intentional for sharing links in conversation).

---

## Naming

| Layer | Value |
| --- | --- |
| User-facing | **Demos** (nav) · **Demos comerciais** (page) |
| Disclaimer | Modelos demonstrativos / sites-conceito — não cases |
| Internal | `/app/portfolio`, `PORTFOLIO_CATALOG`, `WeeklyPortfolio` **unchanged** |
| Regression check | No visible “Portfólio” on gallery (E2E) |

---

## Previous Presentation

- 3-column marketing cards with **hardcoded hex mesh gradients** (`portfolio-cover.tsx`)
- Title overlaid on gradient
- **Disclaimer duplicated** on every card + page
- Feature bullet lists
- CTA “Abrir demonstração”
- AI-template cover differentiation by color gradient only

---

## KEEP / CHANGE / REMOVE

| Element | Decision |
| --- | --- |
| Catalog schema / 3 demos / previewUrl | **KEEP** |
| Niche filters | **KEEP** |
| Copy link (absolute URL) | **KEEP** |
| Page + nav “Demos” naming | **KEEP** |
| Gradient mesh covers | **REMOVE** |
| Per-card disclaimer | **REMOVE** |
| Feature pill/badge soup | **REMOVE** → compact text line |
| Cover strategy | **CHANGE** → typographic (+ image when published) |
| CTA label | **CHANGE** → “Abrir demo” |
| Page meta | **CHANGE** → factual, no double disclaimer |

---

## New Presentation

- PageHeading: Demos comerciais + factual meta  
- Single page-level disclaimer  
- Niche chips (Todos / Odontologia)  
- Grid 1 / 2 / 3 columns — outline `surface` tiles  
- Typographic cover: muted surface + solid accent strip (not mesh gradient)  
- Identity: title · niche · DevFlow Labs label · description · feature line  
- Actions: **Abrir demo** (primary) · **Copiar link** (secondary)  
- Hover: subtle border emphasis only  

---

## Preview Strategy

| Preference | Status |
| --- | --- |
| Real UI screenshot / coverImage | Supported by schema; **none published** in V1 catalog |
| Typographic cover | **Active** for all three demos |
| Decorative mesh / fake browser / AI art | **Rejected** |

Publishing real `coverImage` assets later is additive — no schema break.

---

## Copy

Catalog descriptions remain factual (what the site-conceito shows).  
Softened Atelier Dental wording.  
Banned marketing fragments guarded in `demo-presentation.test.ts`.

---

## Actions

| Class | Action |
| --- | --- |
| PRIMARY | Abrir demo (`target=_blank` → static HTML) |
| SECONDARY | Copiar link (clipboard absolute URL) |

Whole-tile click **not** used — two distinct actions would conflict.

---

## Gallery Layout

Simple visual grid (`base:1`, `md:2`, `xl:3`). No featured section (only 3 peers). No masonry.

---

## Demo Route QA

| Route | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| odontologia-familiar | Inspected | — | Banner + fictitious content OK |
| odontologia-premium | — | Inspected | Usable |
| odontologia-individual | E2E HTTP OK | E2E HTTP OK | Internal HTML gradients **DEFER** (not gallery) |

Internal demo HTML redesign: **DEFER** (not blocking gallery coherence).

Back to Demos: browser/tab close (demos open in new tab) — gallery remains via app nav / Mais.

---

## Responsive

| Viewport | Behavior |
| --- | --- |
| Desktop | 3-column showcase |
| Medium | 2-column; no squeeze |
| Mobile | Single column; actions stacked; no overflow |

---

## Accessibility

- H1 page / H2 per demo  
- Decorative cover: empty `alt` when image; typographic text is readable  
- Feature line not color-only status  
- Touch `minH` on actions  
- Focus via native links/buttons  

---

## Performance

Static catalog (no N+1). Covers are CSS/text — no large image payloads. Demo HTML unchanged.

---

## Anti-Template Check

| Category | Result |
| --- | --- |
| Decorative gradients (gallery) | **PASS** (removed) |
| Glow | **PASS** |
| Glass | **PASS** |
| Oversized cards | **PASS** |
| Generic copy | **PASS** |
| Badge soup | **PASS** (feature line, not pills) |
| Arbitrary icons | **PASS** |
| Dramatic hover | **PASS** (border only) |
| Fake screenshots / metrics | **PASS** |
| Marketing hero | **PASS** |

---

## Cross-Product Coherence

Auth (F12 sober) → shell → Demos (same tokens/radius/buttons) → static demo tab → return via nav. Showcase breathes more than Fila but shares Prospecta chrome.

---

## Files Changed

- `src/app/(authenticated)/app/portfolio/page.tsx`
- `src/features/portfolio/components/portfolio-cover.tsx`
- `src/features/portfolio/components/portfolio-card.tsx`
- `src/features/portfolio/demo-presentation.ts` (+ test)
- `src/features/portfolio/portfolio.catalog.ts` (copy tweak)
- `src/features/portfolio/portfolio.schema.ts` (comments)
- `e2e/portfolio.spec.ts`
- Screenshots: `docs/product/assets/ui-v2/demos-*.png`

---

## Tests

| Suite | Result |
| --- | --- |
| typecheck | PASS |
| lint | PASS (1 pre-existing warning) |
| unit | **374** pass (incl. demo-presentation) |
| build | PASS |

---

## E2E

Local Docker `:5433`, empty Upstash.

- `e2e/portfolio.spec.ts` — **3/3 PASS** (desktop / medium / mobile)  
- `e2e/breadcrumbs.spec.ts` — **5/5 PASS** (regression)

---

## Visual QA

| Surface | Result |
| --- | --- |
| Gallery desktop | PASS |
| Gallery medium | PASS |
| Gallery mobile | PASS |
| Demo familiar desktop | PASS (representative) |
| Demo premium mobile | PASS (representative) |

---

## Screenshots

- `demos-gallery-desktop.png`
- `demos-gallery-medium.png`
- `demos-gallery-mobile.png`
- `demos-route-familiar-desktop.png`
- `demos-route-premium-mobile.png`

---

## Remaining Product Debt

- Real cover screenshots for demos (optional publish via `coverImage`)  
- Internal demo HTML still uses soft page gradients (**DEFER**)  
- Final polish pass across Product UI V2  
- Invite / role management (grill only)

---

## Remaining Technical Debt

- F10: Fila full retrieve; Prioridades candidate set  
- Local Neon hygiene (human)  
- Playwright `pnpm` webServer PATH when reuse fails  

---

## Recommended F14

1. **Final Product UI polish pass** — empty/loading consistency, residual naming, subjective density across F4–F13.  
2. Optional: capture real demo covers into `public/` and wire `coverImage`.  
3. Do **not** invent new demos or invite/role in F14 unless product-grill BUILD.

---

## Environment declaration

- Ambiente: local Docker `:5433` + `next dev`  
- Mutações: E2E login only (local)  
- Migrations: nenhuma  
- Produção: **não modificada**

---

**F13 COMPLETE — NO F14 WORK STARTED. NO COMMIT. NO PUSH.**
