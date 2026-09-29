# Recruiter — Prospecta (EN)

Short, scannable narrative. Not a changelog.

## Product

Prospecta is a founder-led B2B prospecting CRM. Operators pull qualified opportunities, own a weekly portfolio, and record real outreach — channel clicks alone are not “contact.”

## Problem

As generation and retries grow, the hard part is reliability: concurrent ingest races, repeated callbacks after lost responses, and wallet counters that can regress under last-write-wins updates.

## Ownership

End-to-end product engineering of the CRM: commercial domain, authenticated ingest API, acquisition job callbacks, weekly portfolio/wallet semantics, auth/ACL, PostgreSQL-backed tests, and CI/security gates. Google Places collect/score runs in an external acquisition runner; Prospecta stays the system of record.

## Technical outcome (tested scope)

- Concurrent same-identity ingest converges to one lead with idempotent responses in the exercised matrix (including 20-way concurrency).
- Wallet-fill terminal callbacks keep ACTIVE assignments aligned with `assignedCount` at concurrency 1/5/10/20 in the harness.
- Source suite: 346/346 passing against local/ephemeral PostgreSQL.

## Architecture in one line

Next.js fullstack + PostgreSQL/Prisma, with an external acquisition runner and authenticated sync/callback contracts.

Details and claim boundaries: [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md)
