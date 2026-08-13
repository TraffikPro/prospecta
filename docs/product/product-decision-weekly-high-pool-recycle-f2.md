# Product Decision — Weekly HIGH pool recycle (F2)

- **Data:** 2026-08-13
- **Decisão:** **BUILD**
- **Classificação:** PLATFORM (pool / ciclo / recycle) · WORKSPACE (Revisão HIGH)
- **Branch:** `feat/weekly-high-pool-recycle-f2`
- **Pré-requisito:** Weekly Lead Portfolio Fase 1 em produção
- **Não autoriza:** F3 (completar carteira / runner), F4 (cron), dashboard, KPIs, badges, lazy enrollment

## Sequência canônica

```text
NAV              DONE
WEEKLY F1        DONE / production
F2               BUILD agora
F3               PLANNED / BUILD depois
F4               PLANNED / BUILD depois
Dashboard/KPIs   PLANNED depois do motor
Badges           PLANNED depois do dashboard
```

## Hipótese

Se o ADMIN revisar HIGH em pool, reciclar só com ação explícita e limitar a 2 ciclos comerciais, então o time reaproveita HIGH sem o lead tratado voltar sozinho à fila e sem gastar o terceiro ciclo.

## Invariantes

```text
cap = 2 ciclos comerciais
ADMIN_REASSIGN não consome ciclo
TREATED não volta sozinho ao pool
reciclagem = ação explícita ADMIN
recycleLeadToPool revalida tudo sob lock
TREATED não aparece como elegível antes da reciclagem
```

Um ciclo comercial = uma atribuição válida. Transferência `ADMIN_REASSIGN` não inicia ciclo novo:

```text
Assignment #1: ACTIVE → TREATED → RELEASED/RECYCLED   = 1
Assignment #2: ACTIVE → TREATED                         = 1
Total = 2 → terceira atribuição bloqueada
```

Contagem prática: linhas de `LeadAssignment` **exceto** `status === RELEASED && releaseReason === ADMIN_REASSIGN`.

## Pool vs reciclagem (mutuamente exclusivos)

```text
Elegíveis:     HIGH + sem ACTIVE + sem TREATED pendente + ciclos < 2 + não WON/LOST
Recicláveis:   TREATED + sem ACTIVE + ciclos < 2
Atribuídos:    ACTIVE
Encerrados:    ciclos >= 2
```

Fluxo:

```text
ACTIVE → outreach válido → TREATED → recycle ADMIN explícito → RELEASED/RECYCLED
→ se ainda HIGH + ciclos < 2 + não terminal → pool
```

`recycleLeadToPool` relê o lead com `FOR UPDATE` e rejeita UI stale (WON/LOST, perdeu HIGH, ACTIVE apareceu, já não está TREATED, cap atingido). Auditoria: `lead.recycle`. Nova atribuição após reciclagem usa `source: RECYCLED`.

Cap também entra em `reassignLeadToOperator` no mesmo lock do Lead, além da meta semanal. Transferência de ACTIVE (F1 `ADMIN_REASSIGN`) não conta como ciclo novo.

Sem schema/migration nova. Sem `GET /api/dashboard`. Contrato de `PortfolioSummary` inalterado. Minha fila permanece somente leitura.

## Escopo autorizado

1. `countCommercialCycles` + classificação do pool em domínio
2. Cap 2 em `reassignLeadToOperator`
3. `recycleLeadToPool` (ADMIN, lock, revalidação)
4. `listHighPoolReview` (quatro grupos)
5. Página `/admin/high-pool` (Revisão HIGH) + item de nav Gestão (`visibility: admin`)
6. Ação `recycleLeadAction`

## Fora desta PR

- Completar carteira / runner / `AcquisitionJob.requestedBy` (F3)
- Cron de fechamento (F4)
- Dashboard, KPIs, badges
- Lazy enrollment / `ENROLL_OWNED`

## Métrica

ADMIN consegue reciclar um HIGH tratado e reatribuí-lo uma vez; a terceira tentativa falha; TREATED não aparece em Elegíveis.
