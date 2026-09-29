# LinkedIn post drafts — Prospecta Ecosystem

**DO NOT PUBLISH** without explicit approval.

- **PRIMARY_DRAFT:** English
- **SECONDARY_DRAFT:** Portuguese (Brazil)

Engineering Case (main):
https://github.com/TraffikPro/prospecta/blob/main/docs/prospecta/PROSPECTA_ENGINEERING_CASE.md

---

## PRIMARY_DRAFT (EN)

As lead generation and CRM sync grew, reliability mattered more than another form.

Prospecta is a two-repository B2B prospecting system:

- **Lead Generator** — discovery, Score V2 qualification, authenticated sync
- **CRM** — ingest, weekly wallet, pipeline, activities

Three engineering challenges:

1. **Concurrent ingestion** — same external identity must converge to one lead with idempotent responses.
2. **M2M callbacks** — bounded retries across 429/502/503/504/timeout/network without corrupting terminal job state.
3. **Dual-repo validation** — automated suites and CI on both sides, with explicit limits on what local labs do *not* prove.

Write-up (architecture, failure modes, claim boundaries):

→ Prospecta Engineering Case (ecosystem)

Repos:

https://github.com/TraffikPro/prospecta  
https://github.com/TraffikPro/prospecta-lead-generator

---

## SECONDARY_DRAFT (PT-BR)

À medida que geração e sync de leads cresceram, confiabilidade passou a importar mais do que mais um formulário.

O Prospecta é um sistema B2B de prospecção em dois repositórios:

- **Lead Generator** — descoberta, Score V2, sync autenticado
- **CRM** — ingestão, carteira semanal, pipeline, atividades

Três desafios:

1. **Ingestão concorrente** — mesma identidade externa → um lead e respostas idempotentes.
2. **Callbacks M2M** — retries limitados a 429/502/503/504/timeout/rede sem corromper estado terminal.
3. **Validação nos dois repos** — suites + CI de cada lado, com limites explícitos do que labs locais *não* provam.

Case:

→ Prospecta Engineering Case (ecossistema)

---

## Publish checklist

- [ ] Ecosystem case on `main`
- [ ] ApplyFlow remains Featured #1; Prospecta Featured #2
- [ ] Prefer PRIMARY_DRAFT (EN)
- [ ] Explicit approval before posting
