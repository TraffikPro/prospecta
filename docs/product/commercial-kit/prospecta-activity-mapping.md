# Mapeamento de Activity — Prospecta (sem novos enums)

- **Data:** 2026-07-27
- **Decisão:** usar enums **existentes** (`ActivityType` / `ActivityOutcome`). Sem migration.

## Types disponíveis

`WHATSAPP` · `EMAIL` · `NOTE` · `STAGE_CHANGE`

Para este piloto, preferir **`WHATSAPP`** (ou `EMAIL` se for o canal real).

## Outcomes disponíveis

`SENT_NO_REPLY` · `REPLIED` · `NOT_INTERESTED` · `INTERESTED` · `MEETING_SCHEDULED` · `WRONG_CONTACT` · `OTHER`

## Intenção comercial → CRM

| Intenção | Type | Outcome | Nota / stage |
| --- | --- | --- | --- |
| Mensagem enviada, sem resposta ainda | `WHATSAPP` | `SENT_NO_REPLY` | Texto enviado (sem PII extra); `nextFollowUpAt` |
| Respondeu | `WHATSAPP` | `REPLIED` | Resumo da resposta |
| Demonstrou interesse | `WHATSAPP` | `INTERESTED` | O que interessou |
| Reunião combinada | `WHATSAPP` | `MEETING_SCHEDULED` | Data na nota + stage `MEETING` / `nextFollowUpAt` |
| Sem interesse | `WHATSAPP` | `NOT_INTERESTED` | Motivo; considerar `LOST` + `lostReason` |
| Contato errado | `WHATSAPP` | `WRONG_CONTACT` | Quem indicou, se houver |
| Objeção / outro | `WHATSAPP` | `OTHER` | Usar labels de [objections.md](objections.md) |
| Só anotação interna | `NOTE` | — / `OTHER` | Diagnóstico ou preparação |

## Labels de objeção (texto na nota)

Usar frases curtas padronizadas na `body` da Activity:

- `objecao:ja_tem_fornecedor`
- `objecao:sem_prioridade`
- `objecao:sem_orcamento`
- `objecao:contato_incorreto`
- `objecao:nao_percebe_necessidade`
- `objecao:falar_depois`

## Checklist pós-contato

1. Activity salva (não só clique em `wa.me`).
2. Outcome preenchido.
3. Stage coerente (ex.: primeira conversa pode ir a `CONTACTED` conforme regras do CRM).
4. `nextFollowUpAt` se stage aberto.
5. Sem inventar Activity “de mentira”.

## Fora deste kit

Novos valores de enum (`CONTACT_ATTEMPTED`, `PROPOSAL_SENT`, etc.) — **não autorizados** até product-grill + BUILD de domínio.
