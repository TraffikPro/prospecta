# Prospecta Engineering Evidence

Local audit, validation/benchmark, and hardening evidence for Prospecta.
This document records **measured** and **proven** technical results only.
It is not a production capacity claim and not a business-impact report.

## Scope

Results below come from local forensic work on branch `ci/github-security-gates`
with:

- PostgreSQL 16 in disposable Docker containers;
- `tmpfs` storage for ephemeral fixtures;
- loopback binds only (`127.0.0.1`);
- synthetic data only (domains `.test` / `.invalid`);
- no production connection;
- no real PII;
- no migration edits;
- no Prisma upgrade during the investigation;
- no push and no deploy during the evidence capture.

Runtime versions used in the measured runs:

- Node `22.21.1`
- Prisma Client `6.19.3`
- PostgreSQL `16.15` (Alpine container)
- Next.js `16.2.11`

## Reliability

### Problem

Under concurrent wallet-fill callbacks for the same `AcquisitionJob`, real
`ACTIVE` assignments remained correct, but `AcquisitionJob.assignedCount` could
regress to `0` because idempotent peers calculated “zero newly created” and
overwrote the job counter (last-write-wins).

### Baseline (before fix)

Scenario: 10 slots, 20 HIGH candidate leads, concurrent `SUCCEEDED` callbacks.

| Callbacks | ACTIVE real | assignedCount | Duplicate ACTIVE | Overflow |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 10 | 10 | 0 | 0 |
| 5 | 10 | **0** | 0 | 0 |
| 10 | 10 | **0** | 0 | 0 |
| 20 | 10 | **0** | 0 | 0 |

### Correction

- Derive `assignedCount` from distinct persisted wallet assignments for the
  callback candidates in the operational week
  (`countWalletFillAssignedLeads`).
- Persist with a monotonic update under `SELECT ... FOR UPDATE`
  (`max(current, derived)`).
- Treat identical terminal callbacks as idempotent no-ops after the job already
  reached that terminal status.

Commit:

- `9a441430bb79e84ce1d64ae7322b56ef2b6367fa`
- `fix: make wallet-fill callback counts monotonic and idempotent`

### Result (after fix)

Same scenario, same harness shape:

| Callbacks | ACTIVE real | assignedCount | Duplicate ACTIVE | Overflow |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 10 | 10 | 0 | 0 |
| 5 | 10 | 10 | 0 | 0 |
| 10 | 10 | 10 | 0 | 0 |
| 20 | 10 | 10 | 0 | 0 |

Invariants preserved in the tested scenario:

- at most one `ACTIVE` assignment per lead;
- no slot overflow;
- all concurrent callbacks returned success;
- repeated terminal callback remained idempotent.

## Quality Engineering

### E2E baseline

Full Playwright run against local app + ephemeral PostgreSQL:

| Metric | Value |
| --- | ---: |
| Specs | 22 |
| Tests | 65 |
| Passed | 30 |
| Failed | 35 |
| Skipped | 0 |
| Duration | 23.4 min |

### Diagnosis

`next dev` reused one in-memory rate-limit adapter. Loopback browsers shared
the same login identity budget. Failures aligned with the configured
`10 attempts / 15 minutes` login policy and presented as “Credenciais inválidas”
/ redirect timeouts, not 35 independent product regressions.

### Correction

- Opt-in E2E identity scoping via
  `PROSPECTA_E2E_RATE_LIMIT_SCOPING=1`
- Scope header: `x-prospecta-e2e-rate-limit-scope`
- Stable scope per Playwright `BrowserContext`
- Ignored in `production` and `preview`
- Limits inside each scope remain unchanged

Commit:

- `6bc49f3ede3ab9bdbe0f8994e2e5c96d2d566332`
- `test: isolate E2E rate-limit identities per browser context`

### Result

| Metric | BEFORE | AFTER (final measured run) |
| --- | ---: | ---: |
| Passed | 30 / 65 | 64 / 65 |
| Failed | 35 | 1 |
| Duration | 23.4 min | 2.0 min |

Remaining failure:

- `e2e/my-leads.spec.ts:9`
- Classification: **FLAKY**
- Passed in isolation; failed in some full runs
- Recurring `next dev` hydration mismatch observed in logs
- Assertions were **not** weakened to force green

Rate limiting still blocks the 11th attempt inside the same E2E scope while a
second scope starts with an independent budget.

### Source suite

Post-hardening and post-commit validation on ephemeral PostgreSQL:

| Metric | Value |
| --- | ---: |
| Tests | 337 |
| Passed | 337 |
| Failed | 0 |
| Skipped | 0 |
| Suites | 95 |

Also validated:

- `typecheck`: PASS
- `lint`: 0 errors (1 preexisting warning outside scope)
- `production build`: PASS

## Performance

### Listing root cause

Pipeline previously loaded full lead rows (plus owner), grouped everything in
memory, and serialized all cards. At 1,000 synthetic leads the HTML response was
approximately **1.45 MB**.

### Design

Vertical slice: **Pipeline only**.

- Seven-field projection: `id`, `companyName`, `source`, `stage`,
  `intelligence`, `nextFollowUpAt`, `lostReason`
- Exact stage counts via `groupBy`
- Preview size: 3 cards for non-selected stages
- Selected stage page size: 25
- Deterministic order: `createdAt DESC`, `id DESC`
- Offset pagination for shareable page URLs and “page X of Y”
- Ownership/ACL remains in the repository `WHERE`

Intelligence and HIGH Pool were intentionally left unchanged so the measured
delta can be attributed to Pipeline alone.

Commit:

- `06c1479533d5647b963ea7cef03883e0cdcb8609`
- `perf: paginate and project pipeline leads`

### Pipeline HTTP BEFORE / AFTER

**LOCAL SYNTHETIC BENCHMARK — NOT PRODUCTION PERFORMANCE**

Method held constant:

- 1,000 synthetic leads
- local production build (`next start`)
- 5 warm-ups excluded
- 100 measured requests
- nearest-rank p50 / p95 / p99
- 0 HTTP errors in both runs

| Metric | BEFORE | AFTER | Delta |
| --- | ---: | ---: | ---: |
| Payload (median body) | ~1.45 MB | 215,495 bytes | ~85.1% lower |
| concurrency 1 p50 | 310 ms | 43.4 ms | 86.0% lower |
| concurrency 1 p95 | 485 ms | 48.0 ms | 90.1% lower |
| concurrency 1 p99 | 505 ms | 48.6 ms | 90.4% lower |
| concurrency 1 throughput | 2.98 req/s | 23.08 req/s | 7.7× |
| concurrency 10 p50 | 2,942 ms | 336.5 ms | 88.6% lower |
| concurrency 10 p95 | 4,599 ms | 381.7 ms | 91.7% lower |
| concurrency 10 p99 | 5,269 ms | 540.9 ms | 89.7% lower |
| concurrency 10 throughput | 3.19 req/s | 29.18 req/s | 9.1× |

Payload percent uses the rounded historical baseline (`~1.45 MB` ≈ 1,450,000
bytes) versus measured `215,495` bytes:

```text
100 * (1 - 215495 / 1450000) ≈ 85.14%
```

## Scale Investigation

### Experiment

Authorized local fixture:

- host: `127.0.0.1:55432`
- database: `prospecta_perf_hardening`
- PostgreSQL 16 disposable container + `tmpfs`
- 50,000 synthetic leads
- 5,000 synthetic assignments
- dedicated cleanup after evidence capture

### Result

`listHighPoolReview()` → unpaginated `prisma.lead.findMany()` with nested
`owner` and `assignments.assignee` reproduced:

```text
PrismaClientRustPanicError: no entry found for key
```

Measured on the reproduction run:

| Measurement | Value |
| --- | --- |
| Time to panic | 653.260 ms |
| Returned rows | 0 (panic before result) |
| RSS before | 151.277 MB |
| Latest RSS near failure | 159.520 MB |
| Peak sampled RSS | 316.582 MB |
| Node max RSS | 322.012 MB |
| PostgreSQL after panic | healthy; counts remained 50k / 5k |
| Raw SQL EXPLAIN ANALYZE (base join/sort) | 41.407 ms; completed |

Query shape:

- Lead: `id`, `companyName`, `stage`, `intelligence`
- `owner.name`
- all `assignments.status`, `releaseReason`
- nested `assignee.name`
- lead order by `companyName`
- assignment order by `assignedAt`
- **no pagination**

### Classification

`INTERACTION BETWEEN FACTORS`

Supported evidence:

- project query requests unbounded nested relation materialization;
- Prisma Query Engine panics while assembling that high-cardinality result;
- PostgreSQL completes the base SQL and remains healthy;
- RSS rises materially, but no OOM was observed.

Not proven:

- that Prisma alone is the sole cause;
- that memory pressure alone is sufficient;
- that production would behave differently;
- that the system “supports 50k”.

Phase 3 Pipeline pagination did **not** change HIGH Pool. The 50k failure
remains on the unchanged unpaginated HIGH Pool path.

## Testing

Final consolidation validation (ephemeral local PostgreSQL, after the three
product commits):

| Check | Result |
| --- | --- |
| Source suite `src/**/*.test.ts` | 337 / 337 pass |
| Typecheck | PASS |
| Lint | 0 errors |
| Production build | PASS |

Regression tests added with the product commits:

- concurrent wallet-fill callbacks at 1 / 5 / 10 / 20
- E2E rate-limit scope isolation and preserved 11th-attempt block
- Pipeline ownership, projection, and pagination counts

## Claims We Can Make

With the qualifications stated in this document:

1. Concurrent wallet-fill callbacks in the tested scenario keep
   `ACTIVE == assignedCount == 10` with zero duplicate ACTIVE and zero overflow
   through 20 concurrent callbacks.
2. E2E rate-limit isolation raised a measured full-suite pass rate from
   `30/65` to `64/65` without disabling rate limiting.
3. Pipeline listing projection + pagination reduced the measured local synthetic
   response from ~1.45 MB to 215,495 bytes and reduced concurrency-1 p99 from
   505 ms to 48.6 ms.
4. Source suite currently passes `337/337` against ephemeral PostgreSQL.
5. The unpaginated HIGH Pool relational query panics under a local 50k/5k
   synthetic fixture on Prisma `6.19.3`.

## Claims We Cannot Make

Do **not** claim:

- production throughput;
- production p50 / p95 / p99;
- production deduplication effectiveness;
- SLA or availability;
- maximum concurrent users in production;
- safe support for 50k leads in production;
- 100% E2E pass rate;
- business hours saved;
- conversion or revenue impact;
- that updating Prisma alone fixed (or would fix) the 50k panic.

## Career Evidence

Raw verified material only. Not a final CV draft.

### CLAIM 1 — Payload reduction

- **CLAIM:** Redesigned a CRM pipeline listing to avoid full lead materialization,
  reducing measured local synthetic response size from ~1.45 MB to 215,495 bytes.
- **EVIDENCE:** Identical HTTP benchmark method before/after; Pipeline-only
  vertical slice.
- **QUALIFICATION:** Local synthetic benchmark with 1,000 leads. Not production
  performance.
- **SOURCE/COMMIT:** `06c1479533d5647b963ea7cef03883e0cdcb8609`

### CLAIM 2 — p99 reduction

- **CLAIM:** Same Pipeline change reduced measured concurrency-1 p99 from
  505 ms to 48.6 ms and concurrency-10 p99 from 5,269 ms to 540.9 ms.
- **EVIDENCE:** 100 requests, nearest-rank percentiles, 0 HTTP errors.
- **QUALIFICATION:** Local synthetic benchmark. Not production latency or SLA.
- **SOURCE/COMMIT:** `06c1479533d5647b963ea7cef03883e0cdcb8609`

### CLAIM 3 — Race condition corrected

- **CLAIM:** Fixed a last-write-wins race where concurrent wallet-fill callbacks
  could overwrite a correct `assignedCount=10` with `0`.
- **EVIDENCE:** Before/after concurrency matrix for 1/5/10/20 callbacks.
- **QUALIFICATION:** Local synthetic wallet-fill scenario with 10 slots / 20
  HIGH candidates.
- **SOURCE/COMMIT:** `9a441430bb79e84ce1d64ae7322b56ef2b6367fa`

### CLAIM 4 — Concurrent callbacks

- **CLAIM:** After the fix, up to 20 concurrent callbacks preserved
  `ACTIVE=10`, `assignedCount=10`, duplicate ACTIVE `0`, overflow `0`.
- **EVIDENCE:** Identical harness after the monotonic/derived counter change;
  regression test covering the same concurrency levels.
- **QUALIFICATION:** Tested scenario only; assignment creation and metadata
  update remain separate transactions.
- **SOURCE/COMMIT:** `9a441430bb79e84ce1d64ae7322b56ef2b6367fa`

### CLAIM 5 — E2E evolution

- **CLAIM:** Isolated E2E rate-limit identities per browser context and moved a
  measured full suite from `30/65` to `64/65` without disabling auth rate limits.
- **EVIDENCE:** Before/after full Playwright runs; unit proof that the 11th
  same-scope attempt remains blocked.
- **QUALIFICATION:** One remaining flaky case; not a 100% pass claim.
- **SOURCE/COMMIT:** `6bc49f3ede3ab9bdbe0f8994e2e5c96d2d566332`

### CLAIM 6 — Source suite green

- **CLAIM:** Source suite passes `337/337` against ephemeral PostgreSQL after the
  three product commits, with typecheck and production build passing.
- **EVIDENCE:** Consolidation validation matrix.
- **QUALIFICATION:** Local ephemeral database; not CI remote result and not E2E.
- **SOURCE/COMMIT:** post-commit validation on `06c1479` tip

## Interview Cases

### CASE 1 — CONCURRENCY

- **Problem:** Concurrent wallet-fill callbacks kept assignments correct but
  regressed `AcquisitionJob.assignedCount` to `0`.
- **Investigation:** Reproduced with 1/5/10/20 concurrent `SUCCEEDED` callbacks
  on the same job; observed ACTIVE=10 while assignedCount=0 for concurrency > 1.
- **Root Cause:** Each callback computed only the assignments it newly created.
  Idempotent peers computed `0` and overwrote the persisted counter.
- **Decision:** Derive count from persisted assignments and apply a monotonic
  locked update; make identical terminal callbacks idempotent.
- **Implementation:** `countWalletFillAssignedLeads` +
  `updateAcquisitionJobStatusWithMonotonicAssignedCount` (`FOR UPDATE` +
  `Math.max`).
- **Measured Result:** For 5/10/20 callbacks, assignedCount moved from `0` to
  `10` while ACTIVE stayed `10`, duplicate ACTIVE `0`, overflow `0`.
- **Trade-off:** Assignment creation and job metadata update are still separate
  transactions; stronger atomicity would require a larger refactor.

### CASE 2 — PERFORMANCE

- **Problem:** Pipeline responses materialised every lead and returned ~1.45 MB
  at 1,000 synthetic leads, with concurrency-10 p99 at 5.269 s.
- **Investigation:** Field audit showed the UI needed only seven lead fields;
  stage is a relational column suitable for real pagination; Intelligence and
  HIGH Pool have harder pagination constraints.
- **Root Cause:** Full-row select, in-memory grouping, and no server pagination.
- **Decision:** Smallest vertical slice — Pipeline projection + offset pages +
  exact stage counts; leave other listings untouched for attribution.
- **Implementation:** `getPipelineView`, repository `groupBy` / paged `select`,
  stage preview of 3 and page size of 25.
- **Measured Result:** Payload ~1.45 MB → 215,495 bytes; c1 p99 505 → 48.6 ms;
  c10 p99 5,269 → 540.9 ms.
- **Trade-off:** Offset pagination can drift under concurrent inserts on deep
  pages; High Pool and Intelligence remain open work.

### CASE 3 — TEST ISOLATION

- **Problem:** Full E2E suite failed 35/65 after shared login rate limiting
  exhausted the loopback identity budget.
- **Investigation:** Failure onset matched the 11th authenticated login; isolated
  rerun of a failed case passed after server restart; error contexts showed
  login-page “Credenciais inválidas”.
- **Root Cause:** Environment/test-isolation contract — shared in-memory rate
  limiter across Playwright tests — not 35 independent product bugs.
- **Decision:** Scope identities per BrowserContext under an explicit
  non-production flag; keep original limits inside each scope.
- **Implementation:** `scopeRateLimitIdentityForE2E`, automatic Playwright
  fixture, and `PROSPECTA_E2E_RATE_LIMIT_SCOPING=1` for the webServer.
- **Measured Result:** Full-suite pass rate 30/65 → 64/65; duration 23.4 →
  2.0 min; rate limiting still blocks the 11th attempt in one scope.
- **Trade-off:** One flaky navigation case remains; production/preview continue
  to ignore the scoping header.

## Related Commits

| Commit | Message | Category |
| --- | --- | --- |
| `9a441430bb79e84ce1d64ae7322b56ef2b6367fa` | fix: make wallet-fill callback counts monotonic and idempotent | Reliability |
| `6bc49f3ede3ab9bdbe0f8994e2e5c96d2d566332` | test: isolate E2E rate-limit identities per browser context | Quality |
| `06c1479533d5647b963ea7cef03883e0cdcb8609` | perf: paginate and project pipeline leads | Performance |
