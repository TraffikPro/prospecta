# Product Decision — Weekly Lead Portfolio Fase 1

- **Data:** 2026-08-13
- **Decisão:** **BUILD Fase 1** → **DONE** em produção (PR [#56](https://github.com/TraffikPro/prospecta/pull/56), `e54f85e`)
- **Classificação:** PLATFORM (carteira/assignment) · WORKSPACE (Minha fila / Equipe)
- **Contrato runner:** **REFINAR antes da Fase 3** (IDs no callback; ownership via `AcquisitionJob.requestedBy` no CRM)
- **Sequência:** [após a navegação](product-decision-operational-sequence-after-nav.md) — F2–F4 continuam **DEFER**

## Hipótese

Se cada operador tiver meta semanal de HIGH atribuídos, ownership histórico e “tratado” = outreach com outcome após a atribuição, então o time mede responsabilidade sem gastar Places ainda.

## Escopo autorizado (Fase 1)

1. `OperatorWeeklyQuota`, `WeeklyPortfolio`, `LeadAssignment`
2. Semana operacional em `America/Sao_Paulo`; persistência em UTC
3. Meta = HIGH **atribuídos** na semana
4. Tratado = `WHATSAPP`/`EMAIL` com `outcome` após `assignedAt` (negativo conta; NOTE/STAGE_CHANGE não)
5. `ADMIN` define meta; reatribui lead; pull livre Places só `ADMIN`
6. Operador autorizado (`canRunAcquisition` ou `ADMIN`) vê resumo da carteira na Minha fila
7. `MEMBER` só opera leads sob sua responsabilidade (Inbox/Pipeline filtrados)
8. Atribuição **manual** pelo `ADMIN` apenas (reatribuir / atribuir à carteira). Abrir Minha fila é somente leitura — não cria `LeadAssignment` nem carteira.
9. Sem `OperatorWeeklyQuota`: estado “Meta semanal ainda não configurada”; sem carteira implícita; sem vagas; sem meta default.
10. `LeadAssignment.assignedById` identifica quem atribuiu (migration aditiva); auditoria `lead.reassign` permanece atômica na mesma transação.

## Fora (Fases 2–4) — direção fechada, **DEFER** até grill próprio

Não misturar no próximo PR. Hipóteses independentes: ver [sequência](product-decision-operational-sequence-after-nav.md).

- Reciclagem / pool / cap 2 → revisão ADMIN
- “Completar minha carteira” com runner adaptativo
- Cron de fechamento
- Mudança de contrato do generator
- Lazy enrollment (não faz parte da Fase 1; exige nova decisão)

## Métricas Fase 1

| Métrica | Fonte |
| --- | --- |
| Meta | `OperatorWeeklyQuota.weeklyTarget` |
| Atribuídos / tratados / pendentes | `LeadAssignment` ACTIVE + `treatedAt` |
| Taxa de tratamento | treated / assigned (UI) |
