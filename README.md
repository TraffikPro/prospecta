# Prospecta

Plataforma **founder-led** de **prospecção B2B**: pipeline de leads, atividades, follow-ups e handoff para WhatsApp (`wa.me`) + e-mail (`mailto`/template).

Desenvolvida e validada pelo time fundador (3 sócios) em processo real de prospecção.

## Status

Fundação documental + workflow MCP prontos; MVP técnico com decisão **BUILD**.  
App ainda não scaffoldado — próximo passo após MCP verde no Cursor: scaffold + fluxo vertical.

| Doc | Uso |
| --- | --- |
| [`docs/product.md`](docs/product.md) | Produto e normas V1 |
| [`docs/product/product-decision-mvp-technical.md`](docs/product/product-decision-mvp-technical.md) | Grill **BUILD** do MVP técnico |
| [`docs/founding/roles-and-governance.md`](docs/founding/roles-and-governance.md) | Sociedade vs sistema + checklist |
| [`docs/product/pilot-validation-plan.md`](docs/product/pilot-validation-plan.md) | Validação founder-led |
| [`docs/development/mcp-setup.md`](docs/development/mcp-setup.md) | MCPs (Context7, GitHub, Playwright, Figma) |

## Time fundador

```text
- 1 sócio responsável por produto e tecnologia (ADMIN no app V1)
- 2 sócios responsáveis pela validação comercial e operação (MEMBER no app V1)
```

Sociedade: os três são `PARTNER`. Isso **não** iguala permissões técnicas.

## Stack alvo (V1)

- Next.js (App Router) fullstack
- Prisma + PostgreSQL
- Auth com roles `ADMIN` | `MEMBER`
- Deploy previsto: Vercel (ou equivalente)
- Package manager: `pnpm`

## Fora da V1

LinkedIn automation, discador, WhatsApp Business API, sequências AI, enrichment pago obrigatório, multi-tenant SaaS, billing, papel `OWNER`.

## Operação no Cursor

Ver [`.cursor/README.md`](.cursor/README.md) e [`.cursor/AGENTS.md`](.cursor/AGENTS.md).

Fluxo típico de feature:

1. `product-grill` → só **BUILD** segue
2. `commands/plan-feature.md`
3. implementação + validação
4. PR com `## Product Decision`

## Setup (quando o app existir)

```bash
pnpm install
cp .env.example .env
pnpm prisma:migrate
pnpm dev
```

Variáveis: ver `.env.example`.

## Licença

Privado — uso do time fundador (titularidade a registrar em `docs/founding/`).
