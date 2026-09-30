# Local QA — safe authenticated runtime

Reproducible F8/F9/F10 workflow against **local Docker Postgres**, without production Neon or production Upstash.

## Environments

| Env | Database | Rate limit | App |
| --- | --- | --- | --- |
| Local development | Docker `127.0.0.1:5433` / db `prospecta` | Memory (empty Upstash) | `next dev` |
| Local E2E / QA | Same Docker DB | Memory + optional `PROSPECTA_E2E_RATE_LIMIT_SCOPING=1` | `next dev` or Playwright webServer |
| Production | Vercel / Neon only | Upstash **required** (fail-closed) | Vercel |

**Never** point local `.env` `DATABASE_URL` at production Neon for day-to-day QA.

Production DB fingerprint (blocked for seed / mutable tests): `50218bdd86d8`.

## One-time setup

```bash
docker compose up -d
cp .env.example .env.local   # preferred over editing a prod-pointing .env
# Set AUTH_SECRET, SEED_ADMIN_PASSWORD, SEED_MEMBER_PASSWORD locally
pnpm prisma migrate deploy   # or prisma migrate dev
pnpm prisma:seed
```

Seed refuses known production fingerprints unless break-glass is set (see `production-data-hygiene.md`).

## Dev server (safe overrides)

If `.env` still contains remote Neon / Upstash, override **in the process** (do not commit secrets):

```bash
# PowerShell example
$env:DATABASE_URL="postgresql://prospecta:prospecta@127.0.0.1:5433/prospecta"
$env:UPSTASH_REDIS_REST_URL=""
$env:UPSTASH_REDIS_REST_TOKEN=""
$env:RATE_LIMIT_KEY_SECRET=""
$env:NEXT_PUBLIC_APP_URL="http://127.0.0.1:3000"
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Empty Upstash strings prevent Next from refilling remote Redis from `.env` and keep the **memory** rate-limit adapter in development.

## E2E

Default users (from seed emails; passwords from `SEED_*` / Playwright env):

- `admin@prospecta.test`
- `comercial@prospecta.test`

```bash
$env:DATABASE_URL="postgresql://prospecta:prospecta@127.0.0.1:5433/prospecta"
$env:UPSTASH_REDIS_REST_URL=""
$env:UPSTASH_REDIS_REST_TOKEN=""
$env:RATE_LIMIT_KEY_SECRET=""
$env:PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"
$env:PROSPECTA_E2E_RATE_LIMIT_SCOPING="1"
# E2E_*_PASSWORD must match seeded hashes
npx playwright test
```

`e2e/global-setup.ts` runs the production mutation guard before the suite.

## Auth behavior (do not weaken)

| Context | Missing Upstash |
| --- | --- |
| `development` / `test` | Memory adapter OK |
| Production / preview | Fail-closed for login policies |

## Related

- `docs/development/production-data-hygiene.md`
- `docker-compose.yml`
- `.env.example`
