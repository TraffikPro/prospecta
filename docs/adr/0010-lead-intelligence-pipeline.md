# ADR 0010 — Lead Intelligence Pipeline

- **Status:** accepted
- **Data:** 2026-07-23
- **Relacionado:** [0009-google-places-lead-ingestion.md](./0009-google-places-lead-ingestion.md), [../product/founder-pilot.md](../product/founder-pilot.md)
- **Product Decision:** **BUILD** — Fatia 1 (contrato de ingestão no Prospecta). Generator/sync = fatias seguintes.

## Contexto

O diferencial do Prospecta não é só armazenar leads, e sim entregar oportunidades prontas para venda — sem acoplar Places API ao monólito CRM.

```text
PROSPECTA (Core CRM)
        ↑
Lead Intelligence (sistema irmão)
        ↑
Google Places API
```

Regra: automatizar descoberta e análise; **humano no contato**.

## Decisão

### Arquitetura

```text
Google Places API → Collector → Qualification Engine (score/signals/pitch)
        → Prospecta Sync API → CRM Lead
```

### Fatia 1 (esta BUILD) — Prospecta

- `LeadSource`: `MANUAL` | `GOOGLE_PLACES` | `REFERRAL` | `IMPORT`
- `externalId` + `@@unique([source, externalId])`
- `intelligence` (Json) — score, signals, pitch, metadata
- `POST /api/internal/leads` com `Authorization: Bearer <PROSPECTA_IMPORT_TOKEN>`
- Idempotência por `(source, externalId)`; dedupe email/phone existente mantido
- Sem contato automático

### Fatias seguintes (não nesta PR)

2. Generator: Places + qualification engine  
3. Sync score ≥ 70 → POST Prospecta  
4. IA / auditoria de website  

### Score V1 (no generator)

| Sinal | Pontos |
| --- | --- |
| Sem website | +50 |
| Rating ≥ 4.5 | +20 |
| Reviews > 100 | +20 |

## Alternativas consideradas

| Alternativa | Decisão |
| --- | --- |
| Intelligence dentro do Next.js | Rejeitado — separar aquisição do CRM |
| Scraper Maps | Rejeitado — ToS |
| Auto-WhatsApp | Rejeitado nesta fase |

## Consequências

- Contrato estável para o generator sincronizar
- Leads manuais continuam `source = MANUAL`
- Implementação do generator fica desbloqueada sem misturar deploys
