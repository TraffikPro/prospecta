# ADR 0001 — Stack V1 do Prospecta

- **Status:** accepted
- **Data:** 2026-07-22

## Contexto

O Prospecta é um CRM founder-led de prospecção B2B, validado por três sócios
no processo real (1 produto/tecnologia + 2 comercial/operações).
Precisamos de um stack simples, alinhado ao que a Devflow já opera no Na Brasa
(cardápio digital), para reduzir custo de aprendizado e acelerar o MVP.

## Decisão

Usar na V1:

- Next.js App Router **fullstack**
- Prisma + PostgreSQL
- `pnpm`
- Deploy em Vercel (ou equivalente) + Postgres gerenciado
- WhatsApp via link `wa.me` e e-mail via `mailto`/template (sem APIs de envio)

## Alternativas consideradas

- Backend Express/Fastify separado — adia entrega sem ganho no piloto
- CRM SaaS pronto — menos controle e menos aprendizado de produto interno
- Automação LinkedIn desde o dia 1 — risco alto e fora do escopo V1

## Consequências

- Reaproveitamos padrões de `.cursor`, pasta `features/` e Server Actions
- Multi-tenant SaaS, billing e enrichment ficam explicitamente fora da V1
- Auth do time e schema de Lead/Activity ainda precisam de product-grill + BUILD
  na primeira entrega técnica
