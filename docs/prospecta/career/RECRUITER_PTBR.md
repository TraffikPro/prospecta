# Recruiter — Prospecta Ecosystem (PT-BR)

## Produto

Prospecta é um produto founder-led de prospecção B2B em **dois repositórios**: o Lead Generator descobre e qualifica (Score V2); o CRM é a fonte da verdade para ownership semanal, pipeline e atividades.

## Problema

Retries e concorrência quebram CRMs “ingênuos”: leads duplicados, callbacks perdidos e contadores de carteira inconsistentes.

## Ownership

Desenho end-to-end do ecossistema: contrato M2M, ingestão idempotente, wallet/callbacks, testes em PostgreSQL no CRM e fault injection de HTTP no Generator.

## Resultado técnico (escopo testado)

- Ingestão concorrente converge para um lead por identidade externa nos cenários automatizados.
- Callbacks toleram 429/502/503/504/timeout/rede no Generator; CRM preserva estado em replay terminal.
- CI: CRM 346/346 · Generator 84/84 (suites independentes).

## Arquitetura

```text
Places → Generator (score/sync/retry) → CRM (ingest/wallet/pipeline/activities)
```

Detalhes: [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md)
