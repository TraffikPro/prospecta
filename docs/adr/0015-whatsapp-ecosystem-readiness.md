# ADR 0015 — WhatsApp ecosystem readiness (Prospecta ↔ DevFlow)

- **Status:** accepted (readiness / flags off) — **proposed** for go-live
- **Data:** 2026-08-18
- **Relacionado:** [0001](./0001-stack-v1.md), [0007](./0007-activity-foundation-v1.md), [0009](./0009-google-places-lead-ingestion.md), [0014](./0014-acquisition-runner-contract.md), [product-decision-whatsapp-ecosystem-readiness-v1.md](../product/product-decision-whatsapp-ecosystem-readiness-v1.md)

## Contexto

O MVP usa `wa.me` (handoff). Activity humana é a verdade do contato. O mapa de telas e o Sprint 0 mantêm WhatsApp API **fora do envio**.

A DevFlow (inbox WhatsApp) e o Prospecta (CRM) precisam de um contrato **antes** de qualquer disparo: consentimento, E.164, vínculo lead↔thread, APIs assinadas, eventos idempotentes, staging.

`PROSPECTA_IMPORT_TOKEN` (Bearer) serve à ingestão de leads. Não deve autenticar webhooks de conversa.

## Decisão

1. Prospecta permanece single-tenant. `tenantId` no contrato é o tenant **DevFlow** (env), não um modelo `Tenant` no CRM.
2. Consentimento e telefone E.164 vivem no Prospecta (Lead ou entidade de elegibilidade). Default `UNKNOWN`. Places ≠ opt-in.
3. A conversa WhatsApp vive na DevFlow. O CRM guarda só a referência da thread e o estado de integração.
4. APIs são servidor-servidor, segredo **independente** do import token, HMAC + timestamp + idempotency.
5. Eventos entram em `POST /api/internal/whatsapp/events`. `eventId` único. Replay não duplica Activity.
6. Activities geradas pela integração usam origem técnica. Não usam o `authorId` do operador dono do lead.
7. Outcome comercial (`INTERESTED` / `WON` / `LOST` / etc.) continua humano.
8. `wa.me` permanece até o grill de go-live. Flags default `false` em produção.
9. Cadência automática e disparo em massa ficam fora desta ADR.

### Ator técnico (slice D)

Preferência V1: **usuário de sistema** seedado (ex. email interno `whatsapp-platform@prospecta.invalid`, `isActive` sem login) para satisfazer `Activity.authorId` NOT NULL.

Alternativa: `Activity.origin` + `authorId` opcional — só se o sistema-user vazar na UI de “Minha fila”. Decidir na PR 6 com teste de UI.

### E.164 vs `Lead.phone`

Manter `Lead.phone` (dígitos / `wa.me`) e persistir `phoneE164` à parte. Não quebrar handoff atual.

## Alternativas consideradas

| Alternativa | Por que não |
| --- | --- |
| Enviar pela API já no lote Santos | Sem consentimento modelado; contradiz Sprint 0 e política Meta |
| Reusar `PROSPECTA_IMPORT_TOKEN` | Superfície ampla; sem HMAC/replay; rotação acopla ingestão e WhatsApp |
| Copiar histórico/score para a DevFlow | Duas fontes da verdade; PII extra |
| Inferir opt-in do Places | Listagem pública não é consentimento |
| Multi-tenant no Prospecta só para o contrato | Fora da V1; overengineering |
| Webhook Meta direto no Prospecta | Inbox e Cloud API já são da DevFlow |

## Consequências

- Go-live exige grill próprio + flags + staging verde.
- DevFlow precisa implementar link/template/eventos; este repo sozinho não fecha o ecossistema.
- Fatia de elegibilidade (PR 2) é a primeira mudança de schema; a PR 1 é só docs.
- Logs devem mascarar telefone e nunca gravar token nem corpo completo da mensagem.

## Escopo V1 vs futuro

| V1 (readiness) | Futuro (novo grill) |
| --- | --- |
| Contrato, consentimento, flags off | Ligar envio em produção |
| Eventos técnicos + opt-out | Cadência D0/D2/D5/D9 via API |
| Templates aprovados em staging | Fila em massa / SDR |
