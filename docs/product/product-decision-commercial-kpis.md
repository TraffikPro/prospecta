# Product Decision — Weekly commercial KPIs

- **Data:** 2026-08-14
- **Decisão:** **BUILD**
- **Classificação:** PLATFORM (contrato de métricas) · WORKSPACE (consumo futuro em `/app` e badges)
- **Branch:** `feat/commercial-weekly-kpis`
- **Pré-requisito:** motor semanal F1–F4 em produção
- **Não autoriza:** dashboard, cards, gráficos, badges, alertas, ranking, forecast, snapshot persistido, export

## Sequência canônica

```text
F1–F4 = DONE / PRODUÇÃO
KPIs = BUILD agora
DASHBOARD = NEXT
BADGES = DEPOIS
```

## Hipótese

Se o Prospecta expor um contrato tipado e testado de KPIs semanais — calculado no server a partir de `WeeklyPortfolio` / `LeadAssignment` / quota, sem duplicar regra na UI — então o dashboard futuro renderiza números da operação real em vez de reinventar SQL por página.

## Unidade e período

| Campo | Unidade | Período |
| --- | --- | --- |
| `target` | slot de meta (inteiro) | semana operacional |
| `assigned` / `treated` / `pending` / sources / `weekClosed` | **assignment** (`LeadAssignment`), não `Lead.id` distinto | `weekStartAt` do assignment |
| taxas | `0..1` | mesma semana |

Semana = helper F1 (`America/Sao_Paulo`, persistido em UTC). KPI é **read-only**: não cria portfolio, não fecha semana, não parseia inteligência.

## Semântica (pós-inspeção)

`PortfolioSummary` da F1 já entrega `target`, `assigned` (ACTIVE+TREATED), `treated` (status TREATED), `pending` (ACTIVE) da **semana atual**. Isso serve a vagas da carteira ao vivo, não a um histórico de gestão:

- depois do cron F4, ACTIVE vira `WEEK_CLOSED` e some do `assigned` da F1;
- depois do recycle F2, TREATED vira `RELEASED/RECYCLED` e some do `treated` da F1.

KPIs de gestão usam a linha do assignment na semana original:

| KPI | Conta | Não conta |
| --- | --- | --- |
| `assigned` | qualquer assignment da semana que **não** seja leftover `RELEASED`+`ADMIN_REASSIGN` | transferência F1 (o ciclo segue na linha nova do destinatário) |
| `treated` | `treatedAt != null` nessa linha comercial | Activity inválida (NOTE/sem outcome) — `treatedAt` só existe após regra F1 |
| `pending` | `status = ACTIVE` | TREATED, RELEASED, `WEEK_CLOSED` |
| `weekClosed` | `RELEASED` + `WEEK_CLOSED` na **semana do assignment** | semana em que o cron rodou, se for outra |
| `bySource.newAcquisition` | `source = NEW_ACQUISITION` entre os assigned | `AcquisitionJob.createdTotal` / `leadIds` |
| `bySource.recycled` | `source = RECYCLED` (entrada na carteira) | `releaseReason = RECYCLED` |
| `bySource.adminReassigned` | leftovers `ADMIN_REASSIGN` (saída por transferência) | a linha nova no destinatário |
| `bySource.other` | `MANUAL_ADMIN` e `ENROLL_OWNED` | — |

`expiredUntreated` = `released.weekClosed`. Um campo só.

## Taxas

```text
treatmentRate        = treated / assigned
portfolioFillRate    = assigned / target     (capacidade da carteira)
treatmentTargetRate  = treated / target      (execução contra a meta)
```

Denominador `0` → taxa `0`. Sem `NaN`/`Infinity`. Sem média de taxas no agregado ADMIN: `sum(treated) / sum(assigned)`.

## Meta

`OperatorWeeklyQuota` **não é por semana**. Para a semana atual sem portfolio: `target` vem da quota vigente (como a F1). Para semana passada: só `WeeklyPortfolio.targetSnapshot`. Quota de agora não inventa meta de semana sem carteira.

Sem quota e sem snapshot: `quotaConfigured = false`, `target = 0`. Sem default.

## Escopos

- `getOperatorWeeklyKpis`: o próprio usuário, ou ADMIN lendo um operador. MEMBER não lê o outro.
- `getCommercialWeeklyKpis`: ADMIN. `operatorsTotal` = operadores elegíveis ativos; `operatorsWithQuota` = quem tem snapshot da semana ou quota na semana atual.

## Por que não Job / Lead.stage

Job mede sync do runner, não o que entrou na carteira (F3 pode devolver IDs e atribuir menos). `Lead.stage` é pipeline do lead, não execução da carteira semanal.

## Fora desta PR

Dashboard `/app`, badges, gráficos, persistir snapshot, KPI composto / score.

## Métrica

Um service responde meta, atribuídos, tratados, pendentes, taxas, origem e expirados sem tratamento da semana — com testes de fronteira SP e regressão F1–F4.
