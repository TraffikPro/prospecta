# Prospecta

Plataforma **founder-led** de **prospecção B2B**: pipeline de leads, atividades, follow-ups e handoff para WhatsApp (`wa.me`) + e-mail (`mailto`/template).

**Repo canônico:** [`TraffikPro/prospecta`](https://github.com/TraffikPro/prospecta)  
**Produção:** https://prospecta-ten-tau.vercel.app

## Status

**MVP técnico operacional em produção** (`main` @ `c161e25`).

| Marco | Estado |
| --- | --- |
| Auth, Lead, Activity, Pipeline, ingestão, Intelligence Inbox, Minha fila, Portfolio, Lead Detail Redesign | **DONE** |
| Lead Detail Commercial Clarity (Fatia 1) | **DONE** — PRs [#49](https://github.com/TraffikPro/prospecta/pull/49), [#50](https://github.com/TraffikPro/prospecta/pull/50), [#51](https://github.com/TraffikPro/prospecta/pull/51) |
| Gate técnico visual (lote Santos, 5 leads) | **ACCEPTED — 5/5** |
| Testes automatizados | **118** + `typecheck` + `lint` |
| Demo comercial com sócio | **PENDING** (único gate de produto restante) |
| Próximo após a demo | Comparar os 5 leads → escolher clínica-modelo → portfólio **Presença, Conversão e Operação** |

Status canônico: [`docs/product/status-post-mvp.md`](docs/product/status-post-mvp.md)  
Product Decision (clareza comercial): [`docs/product/prospecta-lead-detail-commercial-clarity.md`](docs/product/prospecta-lead-detail-commercial-clarity.md)  
Piloto Santos: [`docs/product/campaign-santos-odonto-batch-1.md`](docs/product/campaign-santos-odonto-batch-1.md)

| Doc | Uso |
| --- | --- |
| [`docs/product/status-post-mvp.md`](docs/product/status-post-mvp.md) | Status pós-MVP (canônico) |
| [`docs/product/prospecta-lead-detail-commercial-clarity.md`](docs/product/prospecta-lead-detail-commercial-clarity.md) | Gate técnico ACCEPTED 5/5 + demo PENDING |
| [`docs/product.md`](docs/product.md) | Produto e normas V1 |
| [`docs/product/founder-pilot.md`](docs/product/founder-pilot.md) | Piloto comercial |
| [`docs/product/campaign-santos-odonto-batch-1.md`](docs/product/campaign-santos-odonto-batch-1.md) | Lote Santos (VALIDATE) |
| [`docs/product/product-decision-mvp-technical.md`](docs/product/product-decision-mvp-technical.md) | Grill **BUILD** do MVP técnico |
| [`docs/founding/roles-and-governance.md`](docs/founding/roles-and-governance.md) | Sociedade vs sistema + checklist |
| [`docs/adr/0005-auth-sessions-acl-v1.md`](docs/adr/0005-auth-sessions-acl-v1.md) | Sessões HttpOnly + ACL |
| [`docs/development/mcp-setup.md`](docs/development/mcp-setup.md) | MCPs |

## O que o produto faz hoje

- Autenticação segura com cookies **HttpOnly** e ACL server-side (`ADMIN` \| `MEMBER`)
- Pipeline de leads, atividades, follow-ups e filas operacionais
- Ingestão externa + **Intelligence Inbox** priorizada por score
- Evidências Google Places: nota, avaliações e link Maps
- Sinais comerciais normalizados + prioridade em português
- Product Decisions para controlar escopo e evitar desenvolvimento especulativo

## Stack

- Next.js (App Router) + TypeScript + **Chakra UI v3** (design system oficial; Tailwind removido)
- Prisma + PostgreSQL
- pnpm
- Sessão em cookie HttpOnly + tabela `Session`
- Roles `ADMIN` | `MEMBER`
- UI: [ADR 0011 — Chakra-only](docs/adr/0011-ui-stack-keep-tailwind.md)

## Setup

```bash
pnpm install
cp .env.example .env
# preencha AUTH_SECRET, SEED_*_PASSWORD e DATABASE_URL
pnpm db:up
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

Seed fictício:

- `admin@prospecta.test` (`ADMIN`)
- `comercial@prospecta.test` (`MEMBER`)
- `operacoes@prospecta.test` (`MEMBER`)

Scripts: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:e2e` · `pnpm build`

## Estrutura

```text
src/
  app/                 # rotas App Router
  features/            # UI + schemas por domínio
  lib/                 # prisma, env
  server/
    actions/
    auth/              # session, guards, password, cookies
    services/
    repositories/
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Operação no Cursor

Ver [`.cursor/README.md`](.cursor/README.md).

## Licença

Privado — uso do time fundador.
