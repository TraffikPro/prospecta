# Prospecta Public Case — C1 Report

**Phase:** C1 — Public README / Product Engineering Landing  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Date:** 2026-09-29  
**Scope:** Documentation only (README + this report)

## Previous README state

- Classification: mixture (product framing + engineering dump)
- Strengths: vertical workflow, activity-as-truth, ecosystem link
- Gaps: no screenshots, stale **346** test count, “Intelligence / HIGH pool”
  naming vs Product UI V2, weak visual/recruiter first viewport

## New structure

1. Opening + top links (live / Engineering Case / ADRs)
2. Hero screenshot (Minha fila)
3. Problem
4. Product workflow (Product UI V2 names)
5. Product surfaces table
6. Supporting screenshots (5)
7. Architecture (+ compact Mermaid)
8. Engineering decisions (7)
9. Authorization
10. Quality (updated metrics + F14 link)
11. Stack
12. Run locally (+ local-qa.md)
13. Layout / Author / License

Language: **English** (matches prior README + Engineering Case; recruiter/portfolio audience). Product UI in screenshots remains Portuguese.

## Screenshots selected

| Role | Asset |
| --- | --- |
| Hero | `docs/product/assets/ui-v2/f14-minha-fila-desktop.png` |
| Supporting | `f14-lead-detail-desktop.png` |
| Supporting | `f14-prioridades-desktop.png` |
| Supporting | `f14-pipeline-desktop.png` |
| Supporting | `f14-equipe-desktop.png` |
| Supporting | `auth-login-desktop.png` |

Demos omitted from supporting set to keep narrative operational (Demos called out in workflow / surfaces text).

## Claims verified

| Claim | Source |
| --- | --- |
| Activity ≠ channel click | Product rules + Lead Detail / Activity model |
| ADMIN / MEMBER + HttpOnly session | ADR 0005 · `src/server/auth` |
| LIST_PAGE_SIZE 25 · Fila section limit 20 | `src/lib/pagination.ts` |
| Score V2 / JSON intelligence (not ML-in-CRM) | Engineering Case · qualification parse tests |
| Demos ≠ WeeklyPortfolio | Product UI V2 / F13–F14 |
| 374 automated tests · 50 E2E · 0 retries | F14 release report |
| Test runner = `tsx --test` on `src/**/*.test.ts` | `package.json` |
| Live URL reachable, login-gated | C1 HTTP/browser check |

## Metrics updated

- README **346** → **374** automated tests (Node test runner; unit + service/integration style under `src/**/*.test.ts`)
- Added **50** E2E / **0** retries from F14
- Added pagination constants only where they explain tradeoffs

### C2 coherence follow-up

`docs/prospecta/PROSPECTA_ENGINEERING_CASE.md` presented **346** as the current
PUBLIC_REPRODUCIBLE CRM source-suite count. C2 updated that deep-dive to
**374 / 374** and noted F14 E2E **50 / 50** as separate PUBLIC_DOCUMENTED
release evidence. Historical evidence packs and career drafts may still cite
346 until a later sync — they were out of C2 scope.

## Live deployment

| Item | Result |
| --- | --- |
| URL | `https://prospecta-ten-tau.vercel.app` |
| Reachable | Yes |
| Redirect | `/` → `/login` |
| Title / brand | Prospecta |
| Login UI | Renders (e-mail, senha, Entrar) |
| Auth | Required — no anonymous product tour |
| Mutations | None performed |
| README treatment | Linked as **Live application (login required)** — not a public interactive demo |

## Architecture presentation

- Compact Mermaid in README (Places → Generator → CRM → DB → Operator)
- Internal layer one-liner
- Deep-dive: `docs/prospecta/PROSPECTA_ENGINEERING_CASE.md`

## Auth / ACL presentation

Concise subsection: session table, cookie names/flags, ADMIN|MEMBER, server guards, M2M tokens. No enterprise/SOC2/LGPD claims.

## Tradeoffs exposed

- Minha fila: semantic open-set vs retrieval cost; render bound 20
- Prioridades: JSON score ranking then page slice
- Explicitly not claiming exactly-once / SLA / ML scoring

## Links validated

| Link | Status |
| --- | --- |
| Live app URL | OK (verified) |
| `docs/prospecta/PROSPECTA_ENGINEERING_CASE.md` | Exists |
| `docs/adr/` + ADR 0005/0009/0010/0014 | Exist |
| All six screenshot paths | Exist under `docs/product/assets/ui-v2/` |
| `docs/audits/PROSPECTA_PRODUCT_UI_F14_RELEASE_REPORT.md` | Exists |
| `docs/development/local-qa.md` | Exists |
| Sibling generator GitHub URL | OK (org repo) |

No F1–F13 dump links.

## Security scan

- No secrets, tokens, connection strings, or seed passwords in README
- Seed emails only (`@prospecta.test`); passwords deferred to env
- Screenshots are fixture/E2E-style leads (no real customer PII claimed)
- Production URL is already public in status docs; login-gated

## Files changed

- `README.md` (rewrite)
- `docs/audits/PROSPECTA_PUBLIC_CASE_C1_REPORT.md` (this report)

## Explicitly not changed

`src/`, `prisma/`, tests, E2E, UI, screenshots, package.json, untracked C0 artifacts (`AGENTS.md`, `CLAUDE.md`, `_f14-qa-log.json`, `_f9-e2e-output.txt`, `social-preview/`).

## Application tests

Not rerun — documentation-only change.

## Commit / push

None. Human review of README diff expected next.
