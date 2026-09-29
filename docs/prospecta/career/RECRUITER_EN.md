# Recruiter — Prospecta Ecosystem (EN)

## Product

Prospecta is a founder-led B2B prospecting **product** split across two repositories: a Lead Generator discovers and qualifies (Score V2); the CRM is the system of record for weekly ownership, pipeline, and activities.

## Problem

As acquisition retries and concurrency grow, naive CRMs fail: duplicate leads, lost callbacks, and drifting wallet counters.

## Ownership

End-to-end ecosystem engineering: M2M contracts, idempotent ingest, wallet/callback semantics, PostgreSQL-backed CRM tests, and Generator HTTP fault injection.

## Technical outcome (tested scope)

- Concurrent same-identity ingest converges to one lead in automated matrices.
- Callbacks retry 429/502/503/504/timeout/network on the Generator; CRM preserves terminal state on replay.
- CI: CRM 346/346 · Generator 84/84 (independent suites).

## Architecture

```text
Places → Generator (score/sync/retry) → CRM (ingest/wallet/pipeline/activities)
```

Details: [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md)
