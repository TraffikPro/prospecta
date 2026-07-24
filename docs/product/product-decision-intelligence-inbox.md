# Product Decision — Intelligence Inbox v1

- **Data:** 2026-07-23
- **Decisão:** **BUILD**
- **Classificação:** WORKSPACE (operação do piloto)

## Problema

Com dezenas/centenas de leads qualificados, abrir um por um no detail não
escala. O comercial precisa de uma fila operacional priorizada.

## Hipótese

Inbox por score/sinais + filtros leves → mais contatos (activity) no mesmo tempo
operacional, sem dashboard.

## Métrica

```text
HIGH visíveis → contatos → respostas → reuniões
```

Observar no piloto: quantos HIGH o comercial abre e registra activity na sessão.

## Escopo autorizado

- Rota `/app/intelligence`
- Lista ordenada por score (desc)
- Filtros: qualification (Todos / HIGH / MEDIUM) + origem (Todos / GOOGLE_PLACES / MANUAL)
- Cards Chakra reutilizando adapter `parseLeadIntelligence`
- Link para lead detail existente

## Fora

- Dashboard / analytics / gráficos
- IA de abordagem
- Auditoria de site
- Novas fontes de aquisição
- Inbox multi-tenant / filas por owner complexas

## Menor implementação

Service filtra leads com `intelligence` parseável; UI Chakra; sem migration.
