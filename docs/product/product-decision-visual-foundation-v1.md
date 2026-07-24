# Visual Foundation v1 — Decision BUILD → DONE

- **Data:** 2026-07-24
- **Decisão:** **BUILD** → **DONE** (shipped)
- **Classificação:** WORKSPACE
- **PR:** [#17](https://github.com/TraffikPro/prospecta/pull/17) (merged)
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `8f83d37`
- **Relacionado:** [product-decision-mobile-experience-v1.md](product-decision-mobile-experience-v1.md), Production Data Hygiene v1
- **Follow-up técnico:** [#18](https://github.com/TraffikPro/prospecta/issues/18) (hydration `ColorModeProvider`, fora do escopo visual)

## Product Decision

```text
Production Data Hygiene v1: DONE
    → Visual Foundation v1: BUILD → DONE
```

## Escopo autorizado

1. Containers: form 720 / detail 960 / listas-pipeline 1120–1200
2. Tokens tipográficos H1 / H2 / meta
3. Home `/app` operacional (saudação + atalhos por papel)
4. Pipeline desktop compacto (contagens, seções recolhíveis, Ver todos)
5. Touch targets ≥ 44px nos pontos críticos
6. Copy P0/P1 e labels críticos em PT (sem tradução completa)

## Fora

- Lead Detail em duas colunas
- Dashboard / gráficos
- Novo design system
- Kanban / drag-and-drop
- Tradução completa de enums/sinais
- Limpeza ampla de notes / formatação de telefone

## Preservar

- Experiência mobile atual
- Breadcrumbs e `?from=` / `?filter=`
- Fluxo Minha fila → lead → Activity
- Regras de negócio, banco e ACL

## Smoke produção (2026-07-24)

Script: `scripts/smoke-visual-foundation-prod.mjs` (somente UI; sem mutação de DB).

| Check | Resultado |
|--------|-----------|
| Desktop `1440×900` — ADMIN `/app` com Olá + Usuários | PASS |
| Desktop — MEMBER Minha fila | PASS |
| Desktop — Pipeline 1ª dobra (stages + accordion) | PASS |
| Mobile `390×844` — Minha fila sem overflow | PASS |
| Mobile — Pipeline accordion sem overflow | PASS |
| Mobile — MEMBER `/app` Olá | PASS |
