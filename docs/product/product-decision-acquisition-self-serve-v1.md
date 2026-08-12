# Product Decision — Acquisition Self-Serve v1 (Fase 1)

- **Data:** 2026-08-12
- **Decisão:** **BUILD** (escopo reduzido — Fase 1)
- **Classificação:** PLATFORM (aquisição + runner) · WORKSPACE (UI `/admin/acquisition`)
- **Predecessor:** DEFER do plano “Places na plataforma” (atualizado por demanda real do comercial)
- **Relacionado:** [ADR 0009](../adr/0009-google-places-lead-ingestion.md), [ADR 0010](../adr/0010-lead-intelligence-pipeline.md), [ADR 0014](../adr/0014-acquisition-runner-contract.md)

## Product Decision

```text
DEFER (Places no monólito) → BUILD Fase 1
ADMIN dispara pull no Prospecta
  → AcquisitionJob
  → runner externo (collect → qualify → sync)
  → status no CRM
  → Intelligence Inbox
Places API permanece fora do Next.js
```

## Problema

O comercial/operador depende de engenharia + CLI do `prospecta-lead-generator` para puxar leads. Isso bloqueia a operação quando há demanda real de aquisição.

## Evidência

- Demanda explícita do operador/comercial.
- Dependência de eng comprovada (syncs manuais, ex.: 2026-08-05).
- Self-serve deixou de ser conveniência e virou capacidade necessária.

## Hipótese

Se o `ADMIN` solicitar cidade + nicho + limite no Prospecta e o runner externo executar o pipeline, então o time amplia a Inbox sem eng no loop, sem embutir Google Places no CRM.

## Métrica

| Métrica | Observação |
| --- | --- |
| Pulls `SUCCEEDED` sem eng | Histórico `/admin/acquisition` |
| Tempo eng em sync | Zero após adoção |
| `created_high` / job | Resultado do job |
| Activity em leads novos (7d) | Manual no CRM |

## Escopo autorizado (Fase 1)

1. Rota `/admin/acquisition` — **somente `ADMIN`**
2. Campos: cidade, query/nicho, limite, campaign slug
3. Confirmação explícita antes de executar
4. Estados: `QUEUED` | `RUNNING` | `SUCCEEDED` | `FAILED`
5. Resultado: encontrados, qualificados, `createdTotal`, `createdHigh`, existentes, falhas
6. Histórico mínimo + auditoria (quem / quando)
7. Idempotência (sem job ativo duplicado para o mesmo fingerprint)
8. Timeout / erro seguro (sem secrets na UI)
9. Leads via sync existente → Intelligence Inbox

## Fora

- Places API no Next.js / chave Google no browser
- Scraper / auto-WhatsApp / acesso `MEMBER`
- Cancelamento / reprocessamento sofisticado
- Entidade Campaign / dashboard analítico

## Menor implementação

`AcquisitionJob` + dispatch HTTP ao runner + callback de status + UI admin. Generator ganha endpoint autenticado; pipeline CLI reutilizado.

## Responsável / prazo

| Área | Owner |
| --- | --- |
| Build | Engenharia |
| Validação piloto | ADMIN autorizados |
| Prazo | Liberar em piloto após testes ACL + falha do runner |

## Evidência que mudaria o escopo

Pedido de Places dentro do CRM → REJECT / novo grill. Cancelamento avançado → Fase 2.
