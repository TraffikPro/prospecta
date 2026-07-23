# ADR 0004 — Scaffold técnico Next.js + Prisma

- **Status:** accepted
- **Data:** 2026-07-23
- **Product Decision:** BUILD — [product-decision-mvp-technical.md](../product/product-decision-mvp-technical.md)

## Contexto

Com MCPs (Context7, GitHub, Playwright) disponíveis na sessão, era necessário
criar a fundação executável sem implementar o CRM completo nem telas finais.

## Decisão

- Next.js 16 App Router + TypeScript + Tailwind + ESLint + `src/`
- pnpm
- Prisma 6 + PostgreSQL; schema inicial `User` / `Lead` / `Activity` + enums V1
- Estrutura `features/` + `server/{actions,services,repositories}` + `lib/prisma`
- Scripts: `lint`, `typecheck`, `test`, `build`, `prisma:*`
- Página placeholder apenas (sem fluxo vertical de UI ainda)

## Fora deste commit

- Auth cookie / login
- CRUD de leads, import CSV, handoff WhatsApp/e-mail
- Telas de pipeline
- CI GitHub Actions (pode vir na sequência)
- Remote GitHub (ainda inexistente)

## Consequências

- `pnpm prisma:migrate` exige `DATABASE_URL` real
- Próxima fatia: auth + ACL `ADMIN`/`MEMBER` + primeiro fluxo vertical
