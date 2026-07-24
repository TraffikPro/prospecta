# Operational Queue v1 — Decision BUILD (reduzido)

- **Data:** 2026-07-24
- **Decisão:** **BUILD** (reduzido)
- **Classificação:** WORKSPACE
- **Relacionado:** [product-decision-my-queue.md](product-decision-my-queue.md), [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md)

## Product Decision

```text
Minha fila v1
    → sintoma: operador ainda decide manualmente o próximo passo
    → BUILD REDUCED: Operational Queue v1 em /app/my-leads
```

## Evidência

- Operadores reais já usam Minha fila / Intelligence / Activity.
- Fricção restante: priorizar atrasados vs sem contato vs conversa sem filtro.
- Não há pedido de Workspace/Kanban — amplificar a rota existente.

## Escopo autorizado

Evoluir `/app/my-leads`:

1. Filtros (URL): `all` · `new` · `follow-up` · `overdue` · `conversation`  
2. Ordenação (comportamento de produto):  
   1. atrasados  
   2. follow-up hoje  
   3. sem Activity  
   4. maior score  
3. Cards: empresa, qualification/score, próxima ação, status, campanha (`intelligence.campaign`), CTA Registrar contato  
4. Quick action → lead detail `#register-activity` (form atual)

## Implementação (performance)

- Filtro e ordenação no **servidor** (`getMyQueueForOwner` → `buildMyQueue`), não no React.
- Query base: `ownerId` + stages ativos + última Activity comercial.
- Buckets derivados (atrasado / hoje / conversa) são calculados no server a partir de `nextFollowUpAt` + outcome — Prisma puro não expressa isso sem SQL bruto; com volume do piloto isso é aceitável. Reavaliar índice/`WHERE` se a fila crescer muito.

## Fora

Kanban, dashboard, gráficos, IA, mudança de score, Campaign model, WhatsApp automático.

## Hipótese

Fila priorizada + CTA direto ↓ tempo até Activity e ↑ % dos 5 leads Santos com Activity.

## Métrica

Tempo até primeira Activity; 5/5 Santos com Activity.
