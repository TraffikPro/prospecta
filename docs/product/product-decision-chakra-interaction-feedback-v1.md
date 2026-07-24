# Chakra Interaction & Feedback v1 — Decision BUILD → DONE

- **Data:** 2026-07-24
- **Decisão:** **BUILD** → **DONE** (shipped + smoke focal confirmado)
- **Classificação:** WORKSPACE
- **Chakra:** `@chakra-ui/react` ^3.36.1
- **PRs:** [#22](https://github.com/TraffikPro/prospecta/pull/22) (A), [#23](https://github.com/TraffikPro/prospecta/pull/23) (B), [#24](https://github.com/TraffikPro/prospecta/pull/24) (SkipNav fix), [#26](https://github.com/TraffikPro/prospecta/pull/26) (status BUILD)
- **Produção:** `https://prospecta-ten-tau.vercel.app` (deploy `#24` em `d457f12`; tip atual inclui o fix)
- **Smoke:** `scripts/smoke-skipnav-prod.mjs`

## Product Decision

```text
Portfolio Comercial v1: DONE
Chakra Interaction & Feedback v1: BUILD → DONE
  PR A — Interaction & Feedback (merged #22)
  PR B — Forms & Data Display (merged #23)
  SkipNav target fix (merged #24)
  Status realinhado para BUILD (#26) até smoke
  Deploy #24 + smoke focal SkipNav — PASS
```

## Fechamento (2026-07-24)

```text
PRs A e B mergeadas
SkipNav #24 mergeada e em Production (d457f12)
Smoke focal SkipNav desktop 1440×900 + mobile 390×844 — OVERALL PASS
Login / navegação curta — PASS
```

**Regra preservada:** DONE só após merge, deploy e smoke confirmados. O registro prematuro via [#25](https://github.com/TraffikPro/prospecta/pull/25) foi corrigido por [#26](https://github.com/TraffikPro/prospecta/pull/26) (`BUILD`); este documento fecha `BUILD → DONE` com evidência de smoke.

## PR A — Interaction & Feedback

Branch: `feat/chakra-interaction-feedback-v1` → merged `#22` (`5e93650`)

- Toaster global (`createToaster` + `<Toaster />`)
- Toast sucesso: Activity (“Contato registrado”), mudança de etapa (“Etapa atualizada”)
- Clipboard oficial no Portfólio (somente Indicator — sem toast duplicado)
- `AppEmptyState` (full em página/filtro; compact em stage do Pipeline)
- `loading.tsx` + Skeleton nas rotas críticas
- SkipNav no AppShell
- Create-lead toast: **fora** (redirect imediato)

## PR B — Forms & Data Display

Branch: `feat/chakra-forms-data-display-v1` → merged `#23` (`79a32a9`)

- PasswordInput + Field/Fieldset no Auth
- Timeline oficial no histórico
- DataList no resumo do lead

## SkipNav fix

Branch: `fix/skipnav-main-content-id` → merged `#24` (`d457f12` / `0430061`)

- `SkipNavLink` e `SkipNavContent` alinhados em `#main-content`
- Foco visível restaurado no `main` (`_focusVisible`)
- Label do link: “Ir para o conteúdo”

## Smoke produção (2026-07-24)

Script: `scripts/smoke-skipnav-prod.mjs` (somente UI; sem mutação de DB além do login).

| Check | Resultado |
|--------|-----------|
| Deploy Production contém `#24` (`d457f12`) | PASS |
| Login / navegação curta (MEMBER → `/app`) | PASS |
| Desktop `1440×900` — `href="#main-content"` | PASS |
| Desktop — ativar SkipNav foca `#main-content` | PASS |
| Desktop — foco visível no `main` | PASS |
| Desktop — próximo `Tab` dentro do conteúdo principal | PASS |
| Mobile `390×844` — mesmos critérios SkipNav | PASS |

**OVERALL PASS** — suíte A+B completa não repetida; apenas smoke focal + login/navegação curta.

## Fora das entregas

ActionBar, Status vs Badge, SegmentedControl, Tabs, Pagination, QR, RadioCard, animações.
