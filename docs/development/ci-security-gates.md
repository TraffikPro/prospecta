# CI and security gates

The repository defines two GitHub Actions workflows:

- `CI`: serial tests against disposable PostgreSQL 16, plus lint, typecheck, and build.
- `Security`: full-history Gitleaks scanning, `pnpm audit` for high/critical
  vulnerabilities, CodeQL for JavaScript/TypeScript, and VibeSec repository
  scanning in OBSERVE mode.

Dependabot checks pnpm/npm dependencies and GitHub Actions weekly. Minor and
patch updates are grouped; major updates remain separate for human review.
Automerge is not enabled.

## Existing controls

| Control | Job | What it covers |
| --- | --- | --- |
| Gitleaks | `Secret scan (Gitleaks)` | Secret detection across complete Git history |
| Dependency Audit | `Dependency audit (high and critical)` | Known npm/pnpm advisories at high/critical via `pnpm audit` |
| CodeQL | `CodeQL (JavaScript and TypeScript)` | Static analysis with `security-extended` queries |
| VibeSec | `VibeSec scan (observe)` | Repository/application/configuration heuristics from the pinned VibeSec Code rule set (`vibesec scan`) |

VibeSec is additive. It does **not** replace Gitleaks, Dependency Audit, CodeQL,
or Dependabot. It is **not** a CVE / dependency advisory scanner.

## VibeSec (dogfooding / OBSERVE)

### Pin

- Package version: `1.1.1`
- Annotated tag: `v1.1.1`
- Immutable commit: `68f088c0694b193425b7258eaab053eec55cc43e`
- Source: `gustavomarques00/vibesec` (checkout + `npm ci` + `npm run build`)

npm registry packages at audit time only published older `0.x` builds, so CI
does **not** install `@latest` or a mutable branch. The workflow verifies both
the commit SHA and `package.json` version before scanning.

### Mode

OBSERVE:

- Exit `0` → clean scan → job succeeds
- Exit `1` → findings observed → job succeeds; summary + `vibesec-report` artifact
- Exit `2` / crash / unexpected → scanner failure → job **fails**
- Job timeout → scanner failure (visible red check)

Findings from this phase do **not** block merge. Scanner infrastructure failures
remain visible and must not be silenced with blanket `continue-on-error`.

### Local equivalent

Requires Node.js `>=20` (Prospecta CI uses `22.21.1`):

```sh
git clone https://github.com/gustavomarques00/vibesec.git
cd vibesec
git checkout 68f088c0694b193425b7258eaab053eec55cc43e
npm ci
npm run build
node dist/cli/main.js scan /path/to/prospecta --format json > vibesec-report.json
echo $?
# 0 = no findings; 1 = findings; 2 = usage/failure
```

Interpret findings as **observed evidence**, not confirmed production exploits.
See dogfooding triage notes under `docs/audits/vibesec-dogfood/` when present.

### Future ENFORCE criteria

Do not enable ENFORCE until Prospecta documents:

1. an accepted false-positive / baseline policy for test fixtures and `.env.example`;
2. stack-aware rule expectations (Prospecta uses Prisma/PostgreSQL, not Supabase RLS);
3. which rule IDs or severity classes may block;
4. a local reproduce path that matches CI pins.

Until then, keep OBSERVE.

## Safety model

CI uses a PostgreSQL service container bound to `127.0.0.1:5432`. Credentials
and application variables are CI-only placeholders. The workflow verifies the
database host with the production-mutation guard before applying the existing
migrations. The database is discarded with the job.

CI never uses production secrets, seeds, resets, external acquisition services,
or Upstash. The build receives empty Upstash variables and a deliberately
unreachable localhost database URL, so an unexpected network dependency fails
instead of reaching a remote service.

The VibeSec job does not receive production credentials, does not require a
database, and runs offline Code-mode scanning only (`vibesec external` is not a
PR gate in this phase).

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
  separate dependency PR; do not use `--force`, lower the severity, or ignore an
  advisory without a documented risk decision. Do not conflate this gate with
  VibeSec.
- **CodeQL:** inspect the alert path and query. CodeQL is supported here because
  Prospecta is a public JavaScript/TypeScript repository with Actions enabled.
- **Gitleaks:** rotate and remove a real credential before rewriting history.
  For a verified false positive, add a narrow entry to
  `.github/gitleaks.toml`, extending the default rules and targeting only the
  exact rule plus path/regex/commit. Never disable Gitleaks globally or add a
  real detected secret to an allowlist.
- **VibeSec (observe):** download the `vibesec-report` artifact. Exit `1` with
  findings is expected during dogfooding and does not fail the job. Exit `2`,
  build/install failure, or timeout is a scanner failure and must be fixed in
  the integration (or upstream VibeSec), not by suppressing the check.

## Dependency-audit baseline

On 2026-08-20, `pnpm audit --audit-level high` found nine pre-existing high
advisories (and two moderate findings) through transitive dependencies of
Next.js, ESLint, and Prisma. The gate was intentionally left blocking (no
`--force`, no lowered severity) until separate dependency remediation.

After later dependency remediation on `main` (including follow-ups around the
CORE UI/UX and related PRs), the Security workflow on `main` has been observed
to pass Dependency Audit again. The gate remains required and still fails the
job when high/critical advisories reappear. Do not weaken it to accommodate
unrelated work, and do not conflate it with VibeSec.

## Branch protection rollout

After these workflows are merged and have completed successfully on `main`,
configure branch protection to require these exact job checks:

- `Tests (PostgreSQL 16)`
- `Quality (lint, typecheck, build)`
- `Secret scan (Gitleaks)`
- `Dependency audit (high and critical)`
- `CodeQL (JavaScript and TypeScript)`

`VibeSec scan (observe)` may be required for visibility once stable, but must
not be treated as an ENFORCE findings gate until the criteria above are met.

Branch protection is deliberately not configured by this change.
