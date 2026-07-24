# Chakra Interaction & Feedback v1 — Decision BUILD

- **Data:** 2026-07-24
- **Decisão:** **BUILD** (não DONE — validação de fechamento pendente)
- **Classificação:** WORKSPACE
- **Chakra:** `@chakra-ui/react` ^3.36.1
- **PRs:** [#22](https://github.com/TraffikPro/prospecta/pull/22) (A), [#23](https://github.com/TraffikPro/prospecta/pull/23) (B), [#24](https://github.com/TraffikPro/prospecta/pull/24) (SkipNav fix)
- **Produção:** `https://prospecta-ten-tau.vercel.app`

## Product Decision

```text
Portfolio Comercial v1: DONE
Chakra Interaction & Feedback v1: BUILD
  PR A — Interaction & Feedback (merged #22)
  PR B — Forms & Data Display (merged #23)
  SkipNav target fix — merged #24 em main
  Deploy e smoke focal — pendentes de confirmação
```

## Estado atual (bloqueio de DONE)

```text
PRs A e B mergeadas
Correção SkipNav mergeada em main (#24)
Deploy e smoke focal pendentes
```

**Regra:** a documentação só marca **DONE** após merge relevante, deploy e smoke focal do SkipNav confirmados. Não afirmar validação que ainda não ocorreu.

**Nota:** um doc anterior chegou a registrar `BUILD → DONE` (PR [#25](https://github.com/TraffikPro/prospecta/pull/25)) sem fechar esse critério; este documento corrige o status para **BUILD**.

## Critério para DONE

Quando o fechamento operacional estiver completo:

1. Confirmar deploy da correção SkipNav em produção
2. Smoke focal SkipNav (desktop + 390px): Tab → ativar SkipNav → foco em `#main-content` → próximo Tab no conteúdo
3. Nova PR documental pequena: `BUILD → DONE`

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
- Foco visível restaurado no `main`

Código em `main`. **Deploy e smoke focal ainda não fecham DONE.**

## Smoke produção

- Autenticado A+B: entregue nas PRs A/B (histórico operacional separado)
- Focal SkipNav pós-`#24`: **pendente de confirmação** (desktop + 390px)

## Fora das entregas

ActionBar, Status vs Badge, SegmentedControl, Tabs, Pagination, QR, RadioCard, animações.
