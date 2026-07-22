# ADR 0002 — Pipeline, lead e atividades V1

- **Status:** accepted
- **Data:** 2026-07-22
- **Product Decision:** [product-decision-mvp-technical.md](../product/product-decision-mvp-technical.md) (**BUILD**)

## Contexto

O MVP técnico precisa de regras objetivas de stage, campos, dedupe e handoff WhatsApp/e-mail para os três sócios operarem sem ambiguidade — antes de qualquer dashboard ou automação.

## Decisão

1. Stages fixos: `NEW` → `QUALIFIED` → `CONTACTED` → `MEETING` → `WON` | `LOST`.
2. Estado **parado** é derivado (filtro), não stage.
3. Lead obrigatório: `companyName` + (`phone` \| `email`) + `ownerId` + `stage`.
4. Dedupe: mesmo e-mail ou mesmo telefone normalizado; bloqueio sem merge.
5. Atividades `WHATSAPP` / `EMAIL` / `NOTE` / `STAGE_CHANGE`; outcomes enumerados.
6. Abrir `wa.me` / `mailto` não altera stage; atividade persistida é a fonte da verdade do contato.
7. `nextFollowUpAt` obrigatório enquanto o stage estiver aberto (após registrar outreach ou ao salvar follow-up).

## Alternativas consideradas

- Kanban com stages ilimitados — complexo demais para 3 pessoas.
- Tratar clique no WhatsApp como “contatado” — mente sobre a realidade operacional.
- Dedupe fuzzy por empresa — falso positivo alto no piloto.

## Consequências

- Schema Prisma deve modelar enums de stage, activity type e outcome.
- UI do lead detail prioriza handoff + modal de atividade + próximo passo.
- Import CSV respeita as mesmas regras de validação/dedupe no server.
