# ADR 0007 — Activity Foundation V1

- **Status:** accepted
- **Data:** 2026-07-23
- **Relacionado:** [0002-pipeline-lead-activity-v1.md](./0002-pipeline-lead-activity-v1.md), [0006-lead-foundation-v1.md](./0006-lead-foundation-v1.md)

## Contexto

Com Lead Foundation entregue, o piloto precisava registrar contato, resultado e
próximo passo sem planilha — sem WhatsApp API nem automações.

## Decisão

- Reutilizar enums `ActivityType` / `ActivityOutcome` do scaffold (sem migration)
- Append-only: create only; sem edição/deleção nesta fase
- `body` = descrição; `Lead.nextFollowUpAt` = data do próximo passo
- Follow-up obrigatório por outcome de continuidade (`INTERESTED`,
  `MEETING_SCHEDULED`, `SENT_NO_REPLY`); não exigir para `NOT_INTERESTED` /
  `WRONG_CONTACT`; `REPLIED` opcional
- Create activity + update lead em `prisma.$transaction`
- Primeira `WHATSAPP`/`EMAIL` em `NEW`/`QUALIFIED` → `CONTACTED` (sem gravar
  `STAGE_CHANGE`)
- Form/timeline no detalhe do lead; sem wa.me/mailto nesta fatia

## Consequências

- Ciclo mínimo: lead → contato → resultado → próximo passo
- Próximas fatias: handoff wa.me/mailto, mudança manual de stage, filtro parados
