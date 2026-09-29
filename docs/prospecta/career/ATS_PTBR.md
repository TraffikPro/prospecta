# ATS — Prospecta Ecosystem (PT-BR)

Máximo 3 bullets. Preferir TIER 1 ([CLAIM_TIERS.md](./CLAIM_TIERS.md)).

- Prospecta — sistema B2B de prospecção em **dois repositórios** (Lead Generator + CRM Next.js/TypeScript/PostgreSQL): aquisição/qualificação → ingestão autenticada → pipeline/atividades.
- Ingestão concorrente idempotente validada em PostgreSQL (matrizes c20 e 10×10) e callbacks M2M com retries limitados a falhas transitórias (Generator) + replay-safe no CRM.
- Suites automatizadas com CI nos dois repos (CRM 346/346 em Postgres; Generator 84/84) — números citados em separado.

Fonte: [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md)
