# Prospecta

Plataforma **founder-led** de **prospecção B2B**: pipeline de leads, atividades, follow-ups e handoff para WhatsApp (`wa.me`) + e-mail (`mailto`/template).

## Status

Scaffold técnico ativo (Next.js 16 + Prisma 6). Fluxo vertical e telas finais ainda não implementados.

| Doc | Uso |
| --- | --- |
| [`docs/product.md`](docs/product.md) | Produto e normas V1 |
| [`docs/product/product-decision-mvp-technical.md`](docs/product/product-decision-mvp-technical.md) | Grill **BUILD** do MVP técnico |
| [`docs/founding/roles-and-governance.md`](docs/founding/roles-and-governance.md) | Sociedade vs sistema + checklist |
| [`docs/product/pilot-validation-plan.md`](docs/product/pilot-validation-plan.md) | Validação founder-led |
| [`docs/development/mcp-setup.md`](docs/development/mcp-setup.md) | MCPs (Context7, GitHub, Playwright, Figma) |

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL
- pnpm
- Auth `ADMIN` \| `MEMBER` (próxima fatia)

## Setup

```bash
pnpm install
cp .env.example .env
# preencha DATABASE_URL com Postgres local ou gerenciado
pnpm prisma:migrate
pnpm dev
```

Scripts: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`

## Estrutura

```text
src/
  app/                 # rotas App Router
  features/            # UI + schemas por domínio
  lib/                 # prisma, env, utilitários
  server/
    actions/
    services/
    repositories/
prisma/
  schema.prisma
  migrations/
```

## Operação no Cursor

Ver [`.cursor/README.md`](.cursor/README.md). MCPs: Context7 antes de APIs versionadas.

## Licença

Privado — uso do time fundador.
