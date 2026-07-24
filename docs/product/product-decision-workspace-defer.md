# Workspace / Meus leads — Decision DEFER

- **Data:** 2026-07-24
- **Decisão:** **DEFER**
- **Classificação:** WORKSPACE (quando reabrir)
- **Relacionado:** [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md), [product-decision-lead-next-action.md](product-decision-lead-next-action.md), [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md)

## Status

**DEFERRED** — não autoriza `/app/workspace`, Kanban nem fila completa.

## Regra

```text
Sem sintoma → sem Workspace
```

Hipótese de “fila operacional” ≠ gargalo observado. O fluxo acabou de ganhar **Próxima ação** no Lead Detail; ainda não sabemos se o comercial executa os 5 contatos com Inbox + Detail.

## Contexto atual

```text
Intelligence Inbox ✅
Lead Detail + Próxima ação ✅
Activity ✅

Pergunta aberta:
O comercial consegue executar os 5 contatos com o fluxo atual?
```

## O que observar na operação

| Caso | Sintoma | Próximo produto |
| --- | --- | --- |
| 1 | “Está fácil, consigo executar.” | Nada |
| 2 | “Não sei qual lead fazer primeiro.” | Workspace / priorização |
| 3 | “Sei qual fazer, mas esqueço follow-up.” | Filtro menor (`Follow-up hoje` / Meus) — não necessariamente Workspace |

## Condições para reabrir o grill

Qualquer uma:

- 5 contatos concluídos no lote Santos; **ou**
- ≥3 Activities reais registradas; **ou**
- comercial pedir fila / priorização

## Primeira versão esperada (quando BUILD)

**Não** começar com `/app/workspace` + Kanban + cards especiais.

Preferir evolução incremental em `/app/leads`:

```text
Filtros:
[Meus leads]
[Follow-up hoje]
[Sem atividade]
```

Reutiliza: owner, `nextFollowUpAt`, Activity existentes.

## Próximo passo agora

```text
Intelligence Inbox
        ↓
Lead Detail
        ↓
Próxima ação
        ↓
Contato
        ↓
Activity
```

Próximo código relevante deve nascer de **reclamação real** do comercial, não de possibilidade.

## Owner / revisão

- Owner: produto + comercial
- Revisão: após primeiros contatos Santos ou ao atingir condição de reabertura
