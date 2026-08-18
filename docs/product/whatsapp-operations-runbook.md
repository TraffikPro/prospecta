# WhatsApp operations runbook (draft)

- **Status:** draft — readiness. **Not** an authorization to send in production.
- **Data:** 2026-08-18
- **Decisão:** [product-decision-whatsapp-ecosystem-readiness-v1.md](product-decision-whatsapp-ecosystem-readiness-v1.md)
- **Contrato:** [whatsapp-ecosystem-contract-v1.md](whatsapp-ecosystem-contract-v1.md)

PR 8 pode substituir este rascunho depois da homologação. Até lá, a cancela permanece fechada.

## Quem usa o quê

| Sistema | Operador faz | Não faz |
| --- | --- | --- |
| Prospecta | Fila, elegibilidade, registrar autorização/recusa, outcome, próximo passo | Conversar no WhatsApp pela API |
| DevFlow | Ler/escrever a thread (quando a integração existir e a flag permitir) | Mudar score, stage, `WON`/`LOST` |
| Lead Generator | collect / qualify / sync | Enviar WhatsApp |
| `wa.me` (piloto) | Contato manual do Sprint 0 | Contar como contato sem Activity |

## Até o go-live (obrigatório)

- `WHATSAPP_INTEGRATION_ENABLED=false` em produção
- `WHATSAPP_TEMPLATE_SEND_ENABLED=false` em produção
- `WHATSAPP_EVENT_SYNC_ENABLED=false` em produção
- E2E **sem** `DATABASE_URL` de produção
- Callbacks Meta / DevFlow só para URL de staging
- Números de teste em allowlist (fictícios ou autorizados por escrito)
- Tenant DevFlow de teste, separado do operacional

## Staging checklist

- [ ] Número de teste Meta (ou WABA dedicado de homologação)
- [ ] Banco staging Prospecta
- [ ] Banco staging DevFlow
- [ ] Tenant de teste
- [ ] Usuários e leads fictícios (sem PII real de clínicas Santos em seed/screenshot)
- [ ] Allowlist de telefones
- [ ] Flags só no ambiente de homologação
- [ ] Suíte de contrato + consentimento + mensagens + jornada E2E verde

## Rollback

Se envio ou sync vazar para produção:

1. Desligar as três flags imediatamente (Vercel env) e redeploy se o valor for build-time.
2. Rotacionar `PROSPECTA_WHATSAPP_TOKEN` e `PROSPECTA_WHATSAPP_SIGNING_SECRET` (não rotacionar o import token a menos que também tenha vazado).
3. Marcar leads atingidos como `OPTED_OUT` se houver dúvida de consentimento.
4. Não apagar Activities (append-only); anotar incidente no body/`AdminAuditEvent`.
5. Reabrir grill de go-live como **REJECT** até causa raiz.

Rotação de segredo: gerar novo par token+HMAC; atualizar DevFlow e Prospecta na mesma janela; invalidar o par antigo; não logar os valores.

## Incidente (rascunho)

| Sintoma | Primeira ação |
| --- | --- |
| Mensagem saiu em produção | Flags off + rotação |
| Webhook duplicado | Conferir `eventId`; não “corrigir” duplicando Activity na mão |
| Opt-out ignorado | Forçar `OPTED_OUT`; flags de send off |
| Assinatura inválida em massa | Não desligar verificação; checar relógio/skew e segredo |
| Operador não sabe onde mexer | Prospecta = CRM; DevFlow = conversa; `wa.me` = piloto |

## Go-live

Proibido por este documento. Exige **Product Grill — WhatsApp API Go-Live v1**.
