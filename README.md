# Prospecta

Plataforma **founder-led** de **prospecção B2B**: pipeline de leads, atividades, follow-ups e handoff para WhatsApp (`wa.me`) + e-mail (`mailto`/template).

## Status

Auth, Lead, Activity, Pipeline e **ingestão externa** (`POST /api/internal/leads`) ativos. Lead Intelligence generator = fatia seguinte ([ADR 0010](docs/adr/0010-lead-intelligence-pipeline.md)). Piloto: [founder-pilot](docs/product/founder-pilot.md).

| Doc | Uso |
| --- | --- |
| [`docs/product.md`](docs/product.md) | Produto e normas V1 |
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
- UI: [ADR 0011](docs/adr/0011-ui-stack-keep-tailwind.md)

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
