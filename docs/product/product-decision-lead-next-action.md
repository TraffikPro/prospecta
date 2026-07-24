# Lead Next Action (UI) — Decision BUILD

- **Data:** 2026-07-24
- **Decisão:** **BUILD**
- **Classificação:** WORKSPACE (amplificador de operação)
- **Relacionado:** [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md), [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md)

## Escopo autorizado

Bloco **Próxima ação** no Lead Detail:

- status atual (sem contato / último outcome)
- ação recomendada (derivada)
- follow-up + alerta hoje/atrasado

Usa apenas `stage`, `nextFollowUpAt` e último `Activity.outcome` existentes.

## Fora

- migration / Prisma / nova rota / novo enum
- mudança de score / Intelligence / Activity rules
- card na Inbox (observar uso no detail primeiro)

## Hipótese

Ver a próxima ação ↑ % dos leads do lote com Activity registrada.

## Métrica

Activities reais no lote Santos; feedback do comercial.
