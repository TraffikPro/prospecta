# Chakra Interaction & Feedback v1 — Decision BUILD

- **Data:** 2026-07-24
- **Decisão:** **BUILD** (DONE só após merge + deploy + smoke das PRs A e B)
- **Classificação:** WORKSPACE
- **Chakra:** `@chakra-ui/react` ^3.36.1

## Product Decision

```text
Portfolio Comercial v1: DONE
Chakra Interaction & Feedback v1: BUILD
  PR A — Interaction & Feedback (merged #22; smoke autenticado pendente)
  PR B — Forms & Data Display (em andamento)
```

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

Branch: `feat/chakra-forms-data-display-v1`

- PasswordInput + Field/Fieldset no Auth
- Timeline oficial no histórico
- DataList no resumo do lead

## Fora das duas PRs

ActionBar, Status vs Badge, SegmentedControl, Tabs, Pagination, QR, RadioCard, animações.
