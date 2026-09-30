# Prospecta Public Case — C3 GitHub Presentation Report

**Phase:** C3 — GitHub presentation layer  
**Branch:** `docs/prospecta-ecosystem-engineering-case` @ `121693a`  
**Date:** 2026-09-30  
**Scope:** Repository metadata + social preview assets only

## Previous metadata

| Field | Value |
| --- | --- |
| Name | `prospecta` (unchanged) |
| Visibility | PUBLIC (unchanged) |
| Default branch | `main` (unchanged) |
| Description | empty |
| Homepage | `https://prospecta-ten-tau.vercel.app` |
| Topics | none |

## Description candidates (audit)

1. *Operational B2B prospecting CRM — own leads, prioritize work, persist contact, progress pipeline.*  
   Clear; strong product signal; slightly long for GitHub UI.
2. *Operational B2B prospecting CRM for founder-led outbound: lead ownership, urgency queue, priorities, activities, and pipeline.*  
   Best balance of product + engineering surface names.
3. *Product-engineered B2B prospecting CRM with activity-as-truth and operational queues.*  
   Strong PE signal; weaker on what the product *is*.

**Selected:** #2

## Homepage

Live app re-checked: `GET /login` → **200**, Prospecta Next.js on Vercel.  
Treatment: website field = live application URL (login required; not a public demo).

## Topics (applied)

`nextjs` · `typescript` · `postgresql` · `prisma` · `crm` · `b2b` · `product-engineering` · `playwright` · `full-stack` · `sales-operations`

Avoided: `artificial-intelligence`, `machine-learning`, `whatsapp-api`, `enterprise`, `microservices`.

## Social preview inventory (`docs/product/assets/social-preview/`)

| Asset | Class | Notes |
| --- | --- | --- |
| `prospecta-linkedin-featured.png` | REMOVE FROM CONSIDERATION | Stale IA: Inteligência / Portfólio; marketing “Commercial Intelligence” |
| `capture-intelligence.html` | REMOVE FROM CONSIDERATION | Source for stale preview |
| `render-preview.mjs` | UNRELATED / legacy | Renders LinkedIn featured asset |
| `capture-github-social.html` | KEEP (source) | Product UI V2 Minha fila fixture |
| `render-github-social.mjs` | KEEP (source) | 1280×640 renderer |
| `prospecta-github-social-preview.png` | KEEP (canonical) | Final GitHub social asset |

### Direction decision

| Approach | Verdict |
| --- | --- |
| A screenshot-only | Weak brand at thumbnail size |
| **B identity + cropped product UI** | **Selected** |
| C pure typography | Weak product evidence |
| D collage | Noisy / template risk |

### Final asset

- Path: `docs/product/assets/social-preview/prospecta-github-social-preview.png`
- Dimensions: **1280×640** (GitHub docs: ≥640×320; best ~1280×640)
- Size: ~45 KB (&lt; 1 MB limit)
- Copy: Prospecta · Operational B2B prospecting CRM · Product Engineering Case
- Product UI: Minha fila (Atrasados / Abrir / Registrar)
- Nav: Prioridades · Pipeline · Leads · Demos (Product UI V2)
- PII: fixture business names only — **clean**
- AI-template risk: **low** (sober B2B, no gradients/glow)

## Metadata applied (via `gh`)

| Field | Applied |
| --- | --- |
| Description | YES |
| Homepage | YES (confirmed) |
| Topics | YES (10) |
| Visibility / name / default branch | NOT touched |

## Manual GitHub step required

**Social preview image** cannot be set via API/CLI for this workflow.

1. Open https://github.com/TraffikPro/prospecta/settings  
2. Social preview → Edit  
3. Upload: `docs/product/assets/social-preview/prospecta-github-social-preview.png`

**REMOTE SOCIAL PREVIEW:** PENDING MANUAL UPLOAD

## Finalization (C3 close)

Versioned for reproducibility:

- `prospecta-github-social-preview.png` (FINAL)
- `capture-github-social.html` (SOURCE)
- `render-github-social.mjs` (SOURCE)

Excluded from commit (remain untracked / not staged):

- `prospecta-linkedin-featured.png` (LEGACY)
- `capture-intelligence.html` (LEGACY)
- `render-preview.mjs` (LEGACY)

Commit message: `docs: add Prospecta GitHub presentation assets`

## Repository-first test

| Signal | Result |
| --- | --- |
| Product identity | PASS (description + preview) |
| Category | PASS (B2B CRM) |
| Engineering signal | PASS (topics + PE badge) |
| Live application | PASS (homepage; login required) |
| Technology discoverable | PASS (topics) |
| **Overall** | **PASS** |

## LinkedIn-share test (predicted)

| Criterion | Result |
| --- | --- |
| Readability at preview size | PASS |
| Credibility | PASS |
| Product clarity | PASS |
| **Overall** | **PASS** |

## README coherence

Description and preview match README product framing (operational CRM, activity/pipeline, founder-led outbound). No README edit.

## Validation

- `git diff --check`: N/A until commit; working tree docs/assets only
- Image opens / 1280×640 / under 1 MB: OK
- Secret/PII scan on preview: OK
- Application code: unchanged

## Commit / push

None (C3 policy). Local social-preview assets remain untracked until a follow-up commit.
