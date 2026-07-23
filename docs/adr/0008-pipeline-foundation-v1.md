# ADR 0008 — Pipeline Foundation V1

- **Status:** accepted
- **Data:** 2026-07-23
- **Relacionado:** [0002-pipeline-lead-activity-v1.md](./0002-pipeline-lead-activity-v1.md), [0007-activity-foundation-v1.md](./0007-activity-foundation-v1.md)

## Contexto

Com Lead + Activity, faltava visão de estágio e mudança explícita de
oportunidade com histórico auditável — sem Kanban sofisticado.

## Decisão

- Rota `/app/pipeline`: lista agrupada por `LeadStage` (sem drag-and-drop)
- `moveLeadStage` em transaction: update `Lead.stage` (+ `lostReason` se LOST)
  + `Activity` `STAGE_CHANGE`
- Body estruturado JSON: `{ "from": "...", "to": "..." }` (UI formata label)
- Movimentação livre entre stages no piloto; rejeitar mesmo stage
- `LOST` exige `lostReason` (texto livre)
- Form de mudança no detalhe do lead; pipeline é leitura + navegação

## Consequências

- MVP operacional completo para piloto founder-led
- Máquina de estados rígida e Kanban ficam para depois da evidência do piloto
