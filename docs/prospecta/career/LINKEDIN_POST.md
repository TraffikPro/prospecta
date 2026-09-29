# LinkedIn post drafts — Prospecta

**DO NOT PUBLISH** without explicit approval.

- **PRIMARY_DRAFT:** English
- **SECONDARY_DRAFT:** Portuguese (Brazil)

Engineering Case link (update if the public path differs after merge):

`docs/prospecta/PROSPECTA_ENGINEERING_CASE.md`

---

## PRIMARY_DRAFT (EN)

As lead generation and CRM sync grew, some problems mattered more than the UI.

Prospecta is a founder-led B2B prospecting CRM: qualify opportunities, own a weekly portfolio, contact via WhatsApp/email, and persist the activity as the source of truth. Acquisition runs in an external generator; the CRM stays the system of record.

Three engineering challenges showed up in the real flow:

1. **Concurrent ingestion** — retries with the same external id must converge to one lead and idempotent responses, not error storms.
2. **Idempotent callbacks** — lost responses and repeated SUCCEEDED updates must not corrupt wallet counters or invent duplicate ACTIVE assignments.
3. **Failure-aware validation** — races and replays are covered with PostgreSQL-backed tests and CI gates, with explicit limits on what those tests do *not* prove.

I wrote up the architecture, failure modes, and evidence boundaries here:

→ Prospecta Engineering Case

(If you work on productized backends — ingest pipelines, retries, and data integrity — happy to compare notes.)

---

## SECONDARY_DRAFT (PT-BR)

À medida que o fluxo de geração e ingestão de leads cresceu, alguns desafios passaram a importar mais do que a interface.

O Prospecta é um CRM founder-led de prospecção B2B: qualificar oportunidades, assumir carteira semanal, contatar por WhatsApp/e-mail e persistir a atividade como verdade operacional. A aquisição roda num generator externo; o CRM permanece a fonte da verdade.

Três desafios técnicos apareceram no fluxo real:

1. **Ingestão concorrente** — retries com o mesmo id externo precisam convergir para um lead e respostas idempotentes, não para uma chuva de erros.
2. **Callbacks idempotentes** — resposta perdida e SUCCEEDED repetido não podem corromper contadores de carteira nem inventar ACTIVE duplicado.
3. **Validação orientada a falha** — corridas e replays cobertos com testes em PostgreSQL e gates de CI, com limites explícitos do que isso *não* prova.

Documentei arquitetura, modos de falha e fronteiras de evidência aqui:

→ Prospecta Engineering Case

---

## Publish checklist (manual)

- [ ] Engineering Case revisado e mergeado na branch pública desejada
- [ ] Link final conferido
- [ ] Tom alinhado ao perfil (ApplyFlow permanece o outro sinal; Prospecta complementar)
- [ ] Aprovação explícita para publicar
- [ ] Preferir PRIMARY_DRAFT (EN) no perfil principal
