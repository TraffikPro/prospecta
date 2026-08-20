# CI and security gates

The repository defines two GitHub Actions workflows:

- `CI`: serial tests against disposable PostgreSQL 16, plus lint, typecheck, and build.
- `Security`: full-history Gitleaks scanning, `pnpm audit` for high/critical
  vulnerabilities, and CodeQL for JavaScript/TypeScript.

Dependabot checks pnpm/npm dependencies and GitHub Actions weekly. Minor and
patch updates are grouped; major updates remain separate for human review.
Automerge is not enabled.

## Safety model

CI uses a PostgreSQL service container bound to `127.0.0.1:5432`. Credentials
and application variables are CI-only placeholders. The workflow verifies the
database host with the production-mutation guard before applying the existing
migrations. The database is discarded with the job.

CI never uses production secrets, seeds, resets, external acquisition services,
or Upstash. The build receives empty Upstash variables and a deliberately
unreachable localhost database URL, so an unexpected network dependency fails
instead of reaching a remote service.

## Equivalent local commands

Use the repository's local PostgreSQL from `docker-compose.yml`, never a remote
or production database:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm prisma:generate
pnpm prisma:deploy
pnpm exec tsx --test --test-concurrency=1 src/**/*.test.ts
pnpm lint
pnpm typecheck
pnpm build
pnpm audit --audit-level high
```

Before `prisma:deploy` or tests, set `DATABASE_URL` to the approved local
`localhost:5433/prospecta` database and run the existing mutation guard. Do not
run seed or reset as part of CI validation.

Gitleaks can be run locally with version `8.30.1`:

```sh
gitleaks git --redact=100 --no-banner --verbose \
  --config .github/gitleaks.toml --log-opts="--all" .
```

CodeQL uploads require GitHub's code-scanning service and cannot be reproduced
fully by these local commands.

## Investigating failures

- **Tests/migrations:** confirm the service-container health check, the
  `127.0.0.1` target, migration output, and the first failing test. Do not retry
  to hide shared-database flakiness.
- **Lint/typecheck/build:** reproduce the exact pnpm command with Node
  `22.21.1` and pnpm `9.15.9`.
- **Dependency audit:** inspect the advisory and dependency path. Fix it in a
  separate dependency PR; do not use `--fix`, lower the severity, or ignore an
  advisory without a documented risk decision.
- **CodeQL:** inspect the alert path and query. CodeQL is supported here because
  Prospecta is a public JavaScript/TypeScript repository with Actions enabled.
- **Gitleaks:** rotate and remove a real credential before rewriting history.
  For a verified false positive, add a narrow entry to
  `.github/gitleaks.toml`, extending the default rules and targeting only the
  exact rule plus path/regex/commit. Never disable Gitleaks globally or add a
  real detected secret to an allowlist.

## Initial dependency-audit baseline

On 2026-08-20, `pnpm audit --audit-level high` found nine pre-existing high
advisories (and two moderate findings) through transitive dependencies of
Next.js, ESLint, and Prisma. The dependency-audit gate is intentionally not
weakened and is expected to block until a separate remediation PR updates the
affected dependency paths.

## Branch protection rollout

After these workflows are merged and have completed successfully on `main`,
configure branch protection to require these exact job checks:

- `Tests (PostgreSQL 16)`
- `Quality (lint, typecheck, build)`
- `Secret scan (Gitleaks)`
- `Dependency audit (high and critical)`
- `CodeQL (JavaScript and TypeScript)`

Branch protection is deliberately not configured by this change.
