# ATS — Prospecta Ecosystem (EN)

Max 3 bullets. Prefer TIER 1 ([CLAIM_TIERS.md](./CLAIM_TIERS.md)).

- Prospecta — two-repository B2B prospecting system (Lead Generator + Next.js/TypeScript/PostgreSQL CRM): acquisition/qualification → authenticated ingest → pipeline/activities.
- Validated idempotent concurrent ingestion on PostgreSQL (c20 and 10×10 matrices) and hardened M2M callbacks with bounded retries for transient HTTP/network failures (Generator) plus CRM-side replay-safe terminal callbacks.
- Automated suites with CI on both repos (CRM 346/346 on Postgres; Generator 84/84) — report counts separately.

Source: [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md)
