# CV distribution plan — Prospecta

**Não modifica PDFs nesta execução.** Matriz para a próxima atualização dos quatro CVs.

Fonte de bullets:

- ATS PT: [`ATS_PTBR.md`](./ATS_PTBR.md)
- Recruiter PT: [`RECRUITER_PTBR.md`](./RECRUITER_PTBR.md)
- ATS EN: [`ATS_EN.md`](./ATS_EN.md)
- Recruiter EN: [`RECRUITER_EN.md`](./RECRUITER_EN.md)

---

## Matrix

| CV variant | What to put | Bullet count | Prospecta placement | ApplyFlow | Avoid |
| --- | --- | --- | --- | --- | --- |
| **ATS PT-BR** | Copy from `ATS_PTBR.md` almost verbatim | **≤3** | Under DevFlow / product eng experience | Keep 2–3 ApplyFlow ATS bullets if space | Feature lists, E2E %, lab-only Score V2 as ATS fact |
| **Recruiter PT-BR** | Short narrative from `RECRUITER_PTBR.md` | 1 short para **or** 3 bullets | Same experience block; human tone | Keep ApplyFlow as complementary story | Changelog / commit laundry list |
| **ATS EN** | Copy from `ATS_EN.md` | **≤3** | Same | Keep ApplyFlow ATS EN bullets | Literal PT translation; “exactly-once” |
| **Recruiter EN** | `RECRUITER_EN.md` | 1 short para **or** 3 bullets | Same | Keep ApplyFlow recruiter blurb | “Production-ready / enterprise-grade” |

---

## What to substitute vs preserve

### Substitute

- Outdated “generic CRM CRUD” lines if any exist
- Inflated test counts not matching the Engineering Case (e.g. old “118 tests” README figure)
- Any claim of exactly-once, SLA, or production p99

### Preserve

- ApplyFlow as a first-class case (local-first / extension / persistence / AI trust)
- Shared stack truth: TypeScript, Next.js/Node, PostgreSQL where accurate
- Honest scope: founder-led / pilot product language if that matches the CV brand

---

## Where Prospecta enters

1. **Experience (DevFlow or equivalent)** — primary home for the 1–3 bullets  
2. **Projects / Selected work** (recruiter variants only) — link to Engineering Case if the CV format allows URLs  
3. **Not** in a huge “Technologies” dump that erases differentiation  

---

## Avoiding a DevFlow-heavy CV

- Cap DevFlow at **two product signals**: ApplyFlow + Prospecta  
- If a third DevFlow project exists, demote it to one line or drop from ATS  
- Prefer depth (reliability + product) over listing every internal tool  
- Recruiter versions tell a story; ATS versions stay keyword-dense but short  

---

## Sequencing (after this package)

1. Review Engineering Case  
2. Merge/publish docs to the intended public branch  
3. Update the four CV PDFs using this matrix  
4. Sync LinkedIn EN/PT/ES per [`LINKEDIN_POSITIONING_PLAN.md`](./LINKEDIN_POSITIONING_PLAN.md)  
5. Featured: add Prospecta case second to ApplyFlow  
6. Publish LinkedIn post only with explicit approval  

Claim boundaries: [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md) §16
