# Interview pitch — Prospecta Ecosystem

Ground claims in [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md)
and [`CLAIM_TIERS.md`](./CLAIM_TIERS.md). Never say exactly-once or production SLA.

---

## 30-second pitch

Prospecta is a two-repo B2B prospecting system I built end-to-end: a Lead Generator acquires and scores businesses; the CRM owns ingest, weekly wallets, and the commercial loop. The hard parts are concurrent idempotent ingestion on PostgreSQL and M2M callbacks that survive transient HTTP failures without corrupting state.

---

## 90-second pitch

Outbound B2B needs discovery and a trustworthy CRM. We split acquisition into prospecta-lead-generator — Places collect, Score V2, sync, HTTP runner — and kept Prospecta CRM as the system of record.

On the CRM, concurrent syncs with the same external id used to throw uniqueness errors even though the DB unique held. We made losers re-read and return idempotent “existing.” Wallet-fill callbacks could overwrite assignedCount to zero; we made counts monotonic under row locks.

On the Generator, callbacks used raw fetch. We added bounded fetchWithRetry for 429/502/503/504/timeout/network, with explicit non-retry for permanent client errors and 500. Both repos have CI: 346 CRM tests on Postgres, 84 Generator tests. Explicitly: idempotent under tested scenarios — not exactly-once, not a production throughput claim.

---

## Deep dive — “Tell me about a difficult technical problem”

Prefer the **ecosystem reliability** story:

1. Generator retries + parallel CRM ingest race on `(source, externalId)`.
2. CRM fix: unique constraint + P2002 re-read → idempotent API.
3. Generator fix: bounded retries on job callbacks; CRM terminal replay safe.
4. Wallet-fill: derive counters from persisted assignments.
5. Proof: automated matrices + fault-injection tests + dual CI.
6. Boundary: crash/replay N=8 and Score V2 10k are documented lab evidence, not CI jobs.

---

## Prepared answers

**What did you personally build?**  
Both sides of the product boundary: Generator acquisition/score/retry path and CRM ingest/wallet/pipeline reliability, contracts, and tests.

**Trade-off?**  
Two repos and app-level idempotency over a heavyweight exactly-once bus; single-replica runner assumptions for current ops.

**How validated?**  
PUBLIC_REPRODUCIBLE tests/CI on both repos; lab figures only with caveats.

**Larger production?**  
Multi-instance runner leases; HIGH Pool pagination; stronger wallet transaction bundling.
