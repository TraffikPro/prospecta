# ADR 0014 — Acquisition runner contract (Prospecta ↔ lead-generator)

- **Status:** accepted
- **Data:** 2026-08-12
- **Relacionado:** [0009](./0009-google-places-lead-ingestion.md), [0010](./0010-lead-intelligence-pipeline.md), [product-decision-acquisition-self-serve-v1.md](../product/product-decision-acquisition-self-serve-v1.md)

## Contexto

O comercial precisa disparar aquisição pela UI do Prospecta. Os ADRs 0009/0010 mantêm Google Places **fora** do monólito CRM. O `prospecta-lead-generator` já executa `collect → qualify → sync`.

## Decisão

1. Prospecta cria `AcquisitionJob` e faz `POST` ao **runner** externo.
2. O runner executa Places + score + sync (reusa `PROSPECTA_IMPORT_TOKEN` / `POST /api/internal/leads`).
3. O runner atualiza o job via callback autenticado no Prospecta.
4. Auth máquina-máquina: `ACQUISITION_JOB_TOKEN` (Bearer) nos dois sentidos (dispatch + callback).
5. Sem Google API key no Prospecta nem no browser.

### Dispatch (Prospecta → runner)

```http
POST {ACQUISITION_RUNNER_URL}/v1/jobs
Authorization: Bearer <ACQUISITION_JOB_TOKEN>
Content-Type: application/json

{
  "jobId": "cuid…",
  "city": "Santos SP",
  "query": "clínica odontológica",
  "limit": 18,
  "campaign": "santos-odontologia-2026-07",
  "requestedById": "cuid…",
  "purpose": "FREE_PULL" | "WALLET_FILL",
  "requestedSlots": 3,
  "prospectaBaseUrl": "https://prospecta-ten-tau.vercel.app",
  "callbackUrl": "https://…/api/internal/acquisition-jobs/{jobId}"
}
```

Resposta esperada: `202 Accepted` (processamento assíncrono).

### Callback (runner → Prospecta)

```http
PATCH {callbackUrl}
Authorization: Bearer <ACQUISITION_JOB_TOKEN>
Content-Type: application/json

{
  "status": "RUNNING" | "SUCCEEDED" | "FAILED",
  "foundCount": 120,
  "qualifiedCount": 30,
  "createdTotal": 11,
  "createdHigh": 11,
  "existingCount": 6,
  "failedCount": 0,
  "errorMessage": null,
  "requestedById": "cuid…",
  "leadIds": ["cuid…"],
  "createdLeadIds": ["cuid…"],
  "existingLeadIds": ["cuid…"]
}
```

Mensagens de erro: seguras (sem tokens, keys ou PII sensível além do necessário).

F3 (`WALLET_FILL`): `leadIds` são IDs internos do Prospecta. O CRM atribui somente esses IDs ao `requestedById` do job, revalidando HIGH / cap / vagas. Pull livre (`FREE_PULL`) continua indo para a Inbox sem auto-atribuição. `requestedById` no callback, se enviado, deve coincidir com o job.

### Idempotência

- No CRM: rejeitar novo job se já existir `QUEUED`/`RUNNING` com o mesmo fingerprint normalizado (`city|query|campaign`).
- No runner: ignorar re-dispatch do mesmo `jobId` se já `RUNNING`/`SUCCEEDED`.

### Timeout

- Runner: AbortController + checagens cooperativas entre etapas e **antes de cada sync**; após abort não há novos POSTs de leads.
- CRM: jobs `RUNNING` além do `timeoutAt` exibem aviso operacional (sem auto-cancel sofisticado na Fase 1).

### Idempotência (endurecimento pós-revisão)

- CRM: índice único parcial `AcquisitionJob_active_fingerprint_key` em `fingerprint` onde `status IN ('QUEUED','RUNNING')` (migration `20260812140000_acquisition_job_active_fingerprint`).
- Runner: claim sob `withExclusive(jobId)` + store em disco; `RUNNING` local fresco + CRM `QUEUED` → dedupe; `RUNNING` stale + CRM `QUEUED` → reclaim (crash antes do callback); `SUCCEEDED`/`FAILED` terminais.
- Request: `limit` inteiro 1–30; body ≤ 16 KiB; `callbackUrl`/`prospectaBaseUrl` restritos ao origin de `PROSPECTA_BASE_URL`.

## Consequências

- Operador `ADMIN` puxa leads sem CLI.
- Custo/quota Places permanece no generator.
- Deploy do runner é pré-requisito operacional (processo separado do Vercel).
