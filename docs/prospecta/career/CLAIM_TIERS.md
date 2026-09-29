# Canonical career claim tiers — Prospecta Ecosystem

Source of truth for CV / interview / LinkedIn wording.
Full technical detail: [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md)

## TIER 1 — CV-safe (prefer for ATS)

Use only PUBLIC_REPRODUCIBLE signals.

1. Built a **two-repository B2B prospecting system** connecting lead
   acquisition/qualification ([prospecta-lead-generator](https://github.com/TraffikPro/prospecta-lead-generator))
   with CRM ingestion and pipeline workflows
   ([prospecta](https://github.com/TraffikPro/prospecta)).
2. Validated **idempotent concurrent ingestion** against PostgreSQL (same
   external identity converges under tested concurrency, including c20 and
   10×10 matrices).
3. Hardened **machine-to-machine callbacks** with bounded retries across
   transient HTTP/network failures (429 / 502 / 503 / 504 / timeout / network)
   on the Generator, with CRM-side terminal callback idempotency.
4. Maintained **automated suites on both repos** with CI gates (CRM 346/346 on
   PostgreSQL; Generator 84/84) — state the numbers **separately**, not as a
   misleading single total.

## TIER 2 — Engineering Case / interview

Safe with explicit boundaries:

- Wallet-fill concurrent callback counter fix (monotonic `assignedCount`)
- Score V2 unit engine in Generator + CRM as intelligence consumer
- Pipeline listing **LOCAL SYNTHETIC BENCHMARK** (payload / p99 deltas)
- Sequential replay matrix documented in CRM evidence (100 unique × 10)
- ApplyFlow vs Prospecta differentiation narrative
- Trade-offs: two-repo split, not exactly-once, single-replica runner

## TIER 3 — Lab evidence only (not CV bullets)

- Score V2 **10,000 evaluations / 0 mismatch** (documented local lab; not Generator CI)
- Crash/replay **N=8** convergent result (documented; lab JSON not committed)
- Unpaginated HIGH Pool 50k panic investigation
- E2E historical 30/65 → 64/65 isolation story (not 100% E2E claim)

## Rejected / prohibited wording

- exactly-once
- production SLA / production throughput
- production ≡ local synthetic benchmarks
- multi-instance / multi-region guarantees
- enterprise-grade / zero vulnerabilities / zero production failures
- “430 tests” as one suite without context
