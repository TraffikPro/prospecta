# Interview pitch — Prospecta

Ground every number in [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md).
Do not say exactly-once, production SLA, or “race-free everywhere.”

---

## 30-second pitch

Prospecta is a founder-led B2B prospecting CRM I built end-to-end. It turns qualified leads into a weekly operating loop: ownership, WhatsApp/email handoff, and persisted activities. The interesting engineering is not the UI — it’s making concurrent ingest and acquisition callbacks idempotent so retries don’t corrupt the system of record. We validated that under real PostgreSQL concurrency tests and keep it behind CI plus security gates.

---

## 90-second pitch

Prospecta solves founder-led outbound: find businesses, qualify them, assign weekly capacity, contact, and record what actually happened. Acquisition is split — an external runner talks to Google Places and scores candidates; Prospecta is the CRM source of truth.

Two reliability problems showed up as the flow got real. First, concurrent ingest with the same external id: check-then-act races made losers throw uniqueness errors even though the DB already prevented duplicate rows. We kept the unique constraint and made the application re-read and return idempotent “existing” outcomes. Second, wallet-fill callbacks: concurrent SUCCEEDED handlers could overwrite a correct assignedCount with zero because idempotent peers thought they created nothing. We derived the count from persisted assignments and applied a monotonic locked update.

Tests cover concurrency matrices (including 20 parallel same-id ingests and 10×10 bursts), lost-response callback replay, and a 346-test PostgreSQL suite. Explicitly: this is idempotent processing under tested scenarios — not exactly-once delivery or a production throughput claim.

---

## Technical deep dive

### “Tell me about a difficult technical problem.”

**Preferred story: concurrent ingest + wallet-fill idempotency**

1. **Setup:** Generator retries and parallel syncs hit `POST /api/internal/leads` with the same `(source, externalId)`.
2. **Symptom:** DB unique held (one row), but API returned errors for losers (`P2002` / duplicate conflicts).
3. **Root cause:** check-then-act; peers all saw “missing,” one create won, others failed loudly.
4. **Fix:** treat same-identity races as idempotent; on `P2002`, re-read canonical lead.
5. **Second bug:** wallet-fill concurrent SUCCEEDED callbacks regressed `assignedCount` to 0 (last-write-wins of “zero new assigns”).
6. **Fix:** count from persisted ACTIVE assignments; `FOR UPDATE` + `max(current, derived)`; terminal repeats are no-ops.
7. **Proof:** automated concurrency tables in `lead.ingest.test.ts` and `wallet-fill.service.test.ts`; evidence write-up in `docs/evidence/`.
8. **Boundary:** validated under tested scenarios; assignment create and metadata update remain separate transactions — trade-off for a smaller fix.

---

## Prepared answers

### What did you personally build?

The CRM vertical: domain model, auth/ACL, ingest API, acquisition job callbacks, weekly portfolio/wallet semantics, pipeline performance work, PostgreSQL tests, and CI/security wiring. Places collect/score stays in the external runner by design.

### What trade-off did you make?

Prefer DB invariants + targeted application recovery over a heavyweight distributed exactly-once protocol. For wallet-fill, ship monotonic derived counts without merging assignment creation and job updates into one mega-transaction (documented trade-off).

### How did you validate it?

Real PostgreSQL tests (not mocks for the race paths), concurrency matrices, callback replay tests, full source suite 346/346, plus CI on ephemeral Postgres. Local synthetic benchmarks for pipeline listing are labeled as such — not production latency.

### What would you change for larger-scale production?

Paginate/reshape large HIGH Pool relational queries; consider stronger transactional bundling for wallet-fill; add multi-instance runner lease semantics if the acquisition worker is horizontally scaled; harden E2E beyond the known flaky case.
