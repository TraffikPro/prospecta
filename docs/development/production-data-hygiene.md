# Production data hygiene

## Policy

- **Never** run mutable Playwright / smoke helpers against the production database or production app URL by default.
- Seed users `@prospecta.test` are preserved; do not delete them in hygiene slices.
- Pilot Santos leads (`campaign=santos-odontologia-2026-07`) are production data.
- Hygiene cleanup is **manual only**. It must not run in CI, Vercel build, or deploy hooks.
- Break-glass (`PROSPECTA_ALLOW_PROD_DB_MUTATION`) must **never** be set in CI or Vercel env.

## Guard

`src/lib/safety/production-mutation-guard.ts` blocks:

- known production DB host fingerprint(s);
- known production app host(s).

Wired into:

- `e2e/global-setup.ts` (all Playwright runs);
- `e2e/helpers/create-intelligence-lead.ts`.

Break-glass (approved hygiene only, local shell, never in CI/Vercel):

```bash
PROSPECTA_ALLOW_PROD_DB_MUTATION=I_UNDERSTAND_PROD_MUTATION
```

## Hygiene script

`scripts/hygiene-e2e-leads.mjs` defaults to **DRY_RUN** (no deletes).

```bash
# Dry-run (default) — inventory + report; never mutates
DATABASE_URL=... pnpm exec node scripts/hygiene-e2e-leads.mjs

# Delete — only after human review of the dry-run report.
# Copy fingerprint + counts from the dry-run output into the expect vars.
DATABASE_URL=... \
  HYGIENE_MODE=DELETE \
  HYGIENE_CONFIRM_DELETE=DELETE_E2E_LEADS_PROD \
  HYGIENE_EXPECT_FINGERPRINT=<from-dry-run> \
  HYGIENE_EXPECT_CANDIDATES=<from-dry-run> \
  HYGIENE_EXPECT_PRESERVED=<from-dry-run> \
  pnpm exec node scripts/hygiene-e2e-leads.mjs
```

Reports: `hygiene-e2e-leads-report-*.json` (gitignored; may contain PII — do not commit).

DELETE is transactional: count drift aborts and rolls back. Re-running dry-run after a successful cleanup should show `candidates=0` (idempotent).

## Staging

Point local/CI `DATABASE_URL` at a **separate** Neon/Postgres database. Keep production URL only in Vercel Production env.
