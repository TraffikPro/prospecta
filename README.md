# Prospecta

Founder-led **B2B prospecting CRM**: qualified leads, weekly ownership, persisted
activities, and WhatsApp (`wa.me`) / e-mail handoff.

> **[Prospecta — Engineering Case (Ecosystem)](docs/prospecta/PROSPECTA_ENGINEERING_CASE.md)**  
> Two-repository product: Lead Generator + CRM — architecture, concurrent
> ingestion, M2M retries, tests/CI, and claim boundaries.

**Repos:**  
- CRM: [`TraffikPro/prospecta`](https://github.com/TraffikPro/prospecta)  
- Lead Generator: [`TraffikPro/prospecta-lead-generator`](https://github.com/TraffikPro/prospecta-lead-generator)

## What is Prospecta?

A vertical commercial workflow for small outbound teams:

```text
login → lead → owner → pipeline → activity → WhatsApp/e-mail → result + next step
```

Channel clicks alone are not contact — **persisted activity** is the source of truth.

## What problem does it solve?

Outbound B2B fails when leads lack ownership, acquisition retries create chaos,
and operators cannot see the next action. Prospecta CRM is the **system of
record**; [`prospecta-lead-generator`](https://github.com/TraffikPro/prospecta-lead-generator)
collects and scores Google Places candidates, then syncs via authenticated M2M.

## How does it work?

1. Operator authenticates (HttpOnly session + `ADMIN` / `MEMBER` ACL).
2. Acquisition runner (external) collects → qualifies → `POST /api/internal/leads`.
3. Leads land in Intelligence / HIGH pool and weekly portfolio flows.
4. Operator contacts via `wa.me` / `mailto` and records an Activity.
5. Pipeline stage + next follow-up drive the loop.

Details: [ADR 0009](docs/adr/0009-google-places-lead-ingestion.md) ·
[ADR 0014](docs/adr/0014-acquisition-runner-contract.md)

## Architecture

```text
Google Places → lead-generator (external) → Prospecta CRM (this repo) → pipeline/activities
```

- **Frontend / backend:** Next.js App Router (fullstack; no separate Express BFF)
- **Database:** PostgreSQL + Prisma
- **Auth:** session table + HttpOnly cookie; machine tokens for ingest/jobs
- **CI:** GitHub Actions — Postgres tests, lint, typecheck, build
- **Security gates:** Gitleaks, dependency audit, CodeQL

## Stack

- Next.js + TypeScript + React + **Chakra UI v3**
- Prisma + PostgreSQL 16
- pnpm
- Playwright (E2E)
- Zod, Resend (email provider abstraction)

## Engineering evidence

| Doc | Purpose |
| --- | --- |
| [`docs/prospecta/PROSPECTA_ENGINEERING_CASE.md`](docs/prospecta/PROSPECTA_ENGINEERING_CASE.md) | Public engineering case |
| [`docs/evidence/PROSPECTA_ENGINEERING_EVIDENCE.md`](docs/evidence/PROSPECTA_ENGINEERING_EVIDENCE.md) | Measured local audit notes |
| [`docs/prospecta/career/`](docs/prospecta/career/) | ATS / recruiter / interview / LinkedIn drafts |
| [`docs/development/ci-security-gates.md`](docs/development/ci-security-gates.md) | CI + security gate ops |

CRM source suite (PostgreSQL CI): **346** tests · Generator suite (sibling repo CI): **84** tests — see Engineering Case; report counts separately.

## Product docs

| Doc | Use |
| --- | --- |
| [`docs/product/status-post-mvp.md`](docs/product/status-post-mvp.md) | Canonical product status |
| [`docs/product.md`](docs/product.md) | Product norms V1 |
| [`docs/founding/roles-and-governance.md`](docs/founding/roles-and-governance.md) | Partnership vs app ACL |
| [`docs/adr/`](docs/adr/) | Architecture Decision Records |

## Setup

```bash
pnpm install
cp .env.example .env
# fill AUTH_SECRET, SEED_*_PASSWORD, DATABASE_URL
pnpm db:up
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

Seed users (fictitious):

- `admin@prospecta.test` (`ADMIN`)
- `comercial@prospecta.test` (`MEMBER`)
- `operacoes@prospecta.test` (`MEMBER`)

Scripts: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:e2e` · `pnpm build`

## Structure

```text
src/
  app/                 # App Router routes + APIs
  features/            # UI + schemas by domain
  lib/                 # prisma, env, safety guards
  server/
    actions/
    auth/
    services/
    repositories/
prisma/
docs/
  prospecta/           # Engineering Case + career package
  evidence/            # Measured audit evidence
  adr/
```

## License

Private — founding team use.
