# LinkedIn positioning plan — Prospecta

**Não edita o LinkedIn.** Recomendação apenas.

Objetivo: Prospecta **complementa** ApplyFlow. Não competir pelo mesmo slot narrativo nem sobrecarregar o perfil.

---

## Signal map

| Case | Signal principal para recrutador |
| --- | --- |
| **ApplyFlow** | Local-first / Chrome extension, evolução de persistência, concorrência no cliente, migration, AI trust boundaries |
| **Prospecta** | Produto B2B multi-usuário, pipeline de ingestão, idempotência/retries no servidor, PostgreSQL, CI/security, ownership de CRM comercial |

Dois sinais de senioridade diferentes → manter ambos visíveis, com papéis claros.

---

## About

### English About

- Keep ApplyFlow as the flagship “hard local-first / extension reliability” line if that is already the primary story.
- Add **one short Prospecta sentence**: B2B prospecting CRM; concurrent ingest + idempotent acquisition callbacks; Next.js/Postgres.
- Avoid stacking both cases as long paragraphs in About — detail lives in Featured / Experience.

### Portuguese About

- Mirror the EN structure (same hierarchy).
- Prospecta in one sentence: CRM de prospecção B2B, ingestão concorrente e callbacks idempotentes validados em testes.

### Spanish About

- Same hierarchy as EN/PT.
- One sentence: CRM B2B de prospección; ingestión concurrente e idempotencia en callbacks; stack Next.js/PostgreSQL.
- Do not invent Spanish-only claims.

---

## DevFlow Experience

Assume DevFlow is the employer/brand umbrella where both products may sit. Adjust company name only if your profile already uses a different label.

### Experience EN

- Role line: Product / Full Stack Engineer (or existing title — do not inflate).
- Bullets: **2 ApplyFlow + 1–2 Prospecta** (or 2+1 if space is tight).
- Prospecta bullets should stress product + reliability (ingest, idempotency, Postgres tests/CI), not a feature laundry list.
- Do not duplicate the full Engineering Case in Experience.

### Experience PT

- Same bullet count and hierarchy as EN.
- Natural PT wording; keep technical nouns (idempotência, ingestão concorrente, PostgreSQL).

### Experience ES

- Same structure; shorter if needed.
- Keep ApplyFlow/Prospecta differentiation explicit so ES readers also see two signals.

---

## Featured

Recommended order after ApplyFlow is already featured:

1. ApplyFlow Engineering Case (keep primary if already performing)
2. **Prospecta Engineering Case** (second featured item)
3. Optional: public repo / demo link only if it does not leak private ops detail

Do not feature LinkedIn drafts, ATS text files, or internal evidence dumps.

---

## Post

- Use [`LINKEDIN_POST.md`](./LINKEDIN_POST.md) **PRIMARY_DRAFT (EN)** on the main profile.
- Publish only after Engineering Case review + explicit approval.
- Cadence: one post; do not flood with Prospecta follow-ups that restate ApplyFlow themes.

---

## Anti-overload rules

- Prospecta must not replace ApplyFlow in About headline energy.
- Avoid four long case studies in Experience.
- CV and LinkedIn should share the same claim boundaries (no exactly-once / SLA language).
