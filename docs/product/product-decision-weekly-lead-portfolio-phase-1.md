# Product Decision — Weekly Lead Portfolio Fase 1

- **Data:** 2026-08-13
- **Decisão:** **BUILD Fase 1**
- **Classificação:** PLATFORM (carteira/assignment) · WORKSPACE (Minha fila / Usuários)
- **Contrato runner:** **REFINAR antes da Fase 3** (IDs no callback; ownership via `AcquisitionJob.requestedBy` no CRM)

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

## Fora (Fases 2–4)

- Reciclagem / pool / cap 2 → revisão
- “Completar minha carteira” com runner adaptativo
- Cron de fechamento
- Mudança de contrato do generator

## Métricas Fase 1

| Métrica | Fonte |
| --- | --- |
| Meta | `OperatorWeeklyQuota.weeklyTarget` |
| Atribuídos / tratados / pendentes | `LeadAssignment` ACTIVE + `treatedAt` |
| Taxa de tratamento | treated / assigned (UI) |
