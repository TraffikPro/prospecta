# Product Decision — Navigation action badges

- **Data:** 2026-08-14
- **Decisão:** **BUILD**
- **Classificação:** WORKSPACE (shell) · PLATFORM (compõe contratos canônicos)
- **Branch:** `feat/navigation-action-badges`
- **Pré-requisito:** dashboard `/app` em `main` ([operational-dashboard](product-decision-operational-dashboard.md))
- **Não autoriza:** ranking, realtime, websocket, `/api/nav-badges`, badge agregado no Mais, badge de Pipeline, badge de Aquisição nesta fase

## Sequência canônica

```text
F1–F4 = DONE
KPIs = DONE
DASHBOARD = DONE
BADGES = BUILD agora
```

Depois do merge:

```text
F1–F4 = DONE
KPIs = DONE
DASHBOARD = DONE
BADGES = DONE
WEEKLY COMMERCIAL SYSTEM = COMPLETE
```

## Hipótese

Se a navegação mostrar só contagens acionáveis já calculadas pelo motor (pending da própria carteira, recicláveis HIGH), então o operador vai ao trabalho pendente sem abrir um segundo dashboard na sidebar.

## Revenue-centric

1. **Objetivo:** “há algo que exige minha atenção aqui?”
2. **Comportamento atual:** nav sem sinais; pendências só na fila/HIGH/dashboard.
3. **Comportamento desejado:** badge discreto em Minha fila e Revisão HIGH.
4. **Fricção:** pendência invisível até abrir a tela.
5. **Hipótese:** ver o número na nav reduz cliques vazios.
6. **Métrica (manual):** operador descreve a pendência da fila pela sidebar.
7. **Proteção:** MEMBER não recebe `highReview`; shell read-only; F1–F4/KPI/dashboard verdes.
8. **Menor alteração:** um `getNavigationBadges` no layout `force-dynamic`.
9. **Risco:** e2e `toHaveText("Fila")` — passou a `toContainText`.
10. **Validação:** unitário de formato/ACL/read-only + e2e desktop/collapsed/mobile.
11. **Validation owner:** Sócio de Produto e Tecnologia.
12. **Observation window:** primeira semana após merge.
13. **Success:** nav indica ação pendente sem nova regra comercial.
14. **Adjustment:** se a sidebar virar painel de números, cortar para os 2 badges.
15. **Rollback:** remover badges do shell; contratos KPI/F2 permanecem.

## Inspeção (decisões)

| Item | Sinal canônico | Badge? |
| --- | --- | --- |
| Minha fila | `getOperatorWeeklyKpis(...).pending` (ACTIVE da semana, próprio usuário) | sim |
| Revisão HIGH | `countRecyclableHighPool` = `classifyHighPoolLead === "recyclable"` (F2) | sim, ADMIN |
| Aquisição | `FAILED` é histórico terminal; não há ack; RUNNING não é pendência | **não nesta fase** |
| Pipeline | overdue existe na Minha fila, não no pipeline | **não** |
| Mais (botão) | soma heterogênea perderia semântica | **não** |

ADMIN em Minha fila usa a **própria** carteira, nunca `team.pending`.

MEMBER nunca consulta o pool HIGH. O payload não inclui a chave `highReview`.

## Contrato

```ts
type NavigationBadges = {
  myQueue: number
  highReview?: number // somente ADMIN
}
```

`0` não renderiza badge. Visual `1–99` / `99+`; o leitor de tela usa o número real.

Uma composição por request (`react.cache` entre layout e `/app/more`). Sem N+1. Sem API pública.

Erro de badge: shell permanece; log; badges ausentes. Sem `NaN` / `?` / `Erro`.

## Atualização

Layout autenticado já é `force-dynamic`. Mutations que mudam pending/recicláveis chamam `revalidatePath("/", "layout")`. Sem realtime.

## Fora

Aquisição, Pipeline, Inteligência, Leads, Portfólio, Equipe, Visão geral, ranking, pulse/bounce.
