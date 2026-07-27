# Prospecta

Plataforma **founder-led** de **prospecção B2B**: pipeline de leads, atividades, follow-ups e handoff para WhatsApp (`wa.me`) + e-mail (`mailto`/template).

## Status

**MVP operacional em produção** (`main` @ `d85c8f5`). Auth, Lead, Activity, Pipeline, ingestão externa, Intelligence Inbox, Minha fila, Portfolio e Lead Detail (Redesign A+B+C) estão DONE. Próximo passo: **VALIDATE** o piloto comercial (lote Santos) — não reabrir auth/login nem polish sem evidência.

Status canônico: [`docs/product/status-post-mvp.md`](docs/product/status-post-mvp.md).  
Produção: `https://prospecta-ten-tau.vercel.app` · Repo: [`TraffikPro/prospecta`](https://github.com/TraffikPro/prospecta).

| Doc | Uso |
| --- | --- |
| [`docs/product/status-post-mvp.md`](docs/product/status-post-mvp.md) | Status pós-MVP (canônico) |
| [`docs/product.md`](docs/product.md) | Produto e normas V1 |
| [`docs/product/founder-pilot.md`](docs/product/founder-pilot.md) | Piloto comercial |
| [`docs/product/campaign-santos-odonto-batch-1.md`](docs/product/campaign-santos-odonto-batch-1.md) | Lote Santos (VALIDATE) |
| [`docs/product/product-decision-mvp-technical.md`](docs/product/product-decision-mvp-technical.md) | Grill **BUILD** do MVP técnico |
| [`docs/founding/roles-and-governance.md`](docs/founding/roles-and-governance.md) | Sociedade vs sistema + checklist |
| [`docs/adr/0005-auth-sessions-acl-v1.md`](docs/adr/0005-auth-sessions-acl-v1.md) | Sessões HttpOnly + ACL |
| [`docs/development/mcp-setup.md`](docs/development/mcp-setup.md) | MCPs |

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
