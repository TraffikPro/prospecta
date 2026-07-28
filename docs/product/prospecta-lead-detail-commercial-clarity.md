# Product Decision — Lead Detail Commercial Clarity (Fatia 1)

- **Data:** 2026-07-28
- **Decisão:** **BUILD** (escopo reduzido)
- **Status técnico:** **ACCEPTED — 5/5** (gate visual + correção de Notas)
- **Status de produto:** demo comercial = gate final restante
- **Classificação:** WORKSPACE (apresentação/operação do detail) · catálogo de sinais = PLATFORM leve
- **Arquivo de referência:** `prospecta-lead-detail-commercial-clarity`
- **Rota:** `/app/leads/[id]`
- **PRs:**
  - Fatia 1: [#49](https://github.com/TraffikPro/prospecta/pull/49) (merged)
  - Correção complementar (Notas / `HIGH`): [#50](https://github.com/TraffikPro/prospecta/pull/50) (merged `f9dedf6`)
- **Relacionado:** [ADR 0010](../adr/0010-lead-intelligence-pipeline.md), [Lead Detail Redesign v1](product-decision-lead-detail-redesign-v1.md), [Intelligence Inbox](product-decision-intelligence-inbox.md)

## Product Decision

```text
Lead Detail Commercial Clarity — Fatia 1

Proposta completa (P0–P2, 34 itens): REDUCE SCOPE
Fatia 1: BUILD → implementada (#49)
Gate técnico visual: ACCEPTED — 5/5
Correção complementar Notas: #50 (strip Score/HIGH)
Demo comercial: PENDING (único gate de produto restante)
```

## Problema

Ao abrir o lead, a inteligência mistura português/inglês, possíveis duplicatas de
sinais, códigos técnicos em notes e falta de evidências Places (nota, avaliações,
Maps). Isso impede explicar a oportunidade em menos de 15 segundos numa demo
comercial.

## Evidência

- Catálogo atual mapeia só `NO_WEBSITE`, `HIGH_RATING`, `HIGH_REVIEWS`.
- Fallback de código desconhecido vira Title Case em inglês
  (`HIGH_REPUTATION` → “High reputation”).
- `rating` / `reviews` / `googleMapsUrl` já entram no contrato Zod de ingest, mas
  o parser/UI não os expõem.
- Notes são exibidas brutas (podem trazer códigos ou `rating=…; reviews=…`).
- Score breakdown, endereço completo, `collectedAt` e versionamento **não**
  existem de forma confiável.
- Gate visual pós-#49: 5/5 leads do lote Santos exibiam
  `Score: 90/100 (HIGH)` nas Notas — vazamento sistêmico corrigido na #50.

## Hipótese

Com evidências Places + sinais sem ruído técnico/duplicado, o comercial explica
a oportunidade sem “traduzir” a tela.

## Métrica

Checklist manual no piloto: em **5 leads reais** do lote, nenhuma informação
técnica ou duplicada aparece; o apresentador completa o pitch em **&lt;15s**
usando somente a tela.

## Escopo autorizado (Fatia 1)

1. Catálogo único de sinais (código canônico, aliases, rótulo PT).
2. Normalização + deduplicação de sinais no parser/view-model.
3. Labels padronizados:
   - `Alta reputação no Google`
   - `Volume relevante de avaliações`
   - `Website não identificado`
4. Expor `rating`, `reviews` e `googleMapsUrl` no view-model + UI.
5. Traduzir classificação na UI: `Prioridade alta` / `média` / `baixa`
   (código `HIGH` | `MEDIUM` | `LOW` permanece interno).
6. Sanitizar notes na exibição: sem códigos técnicos; sem repetir o que já está
   em sinais/diagnóstico/pitch/evidências.
7. Testes de regressão (dedupe, aliases, sem código cru na UI, fallback legível).

## DEFER (fora desta fatia)

- Endereço completo e data de coleta (sem campos confiáveis hoje)
- Fonte por campo; estados `Não coletado` / `Desatualizado` / `Confirmado`
- Score breakdown / Score V2 / versionamento do modelo
- Separação visual ativos vs oportunidades; reescrita automática do diagnóstico
- Redesign amplo de hierarquia, skeleton, acessibilidade profunda
- Backfill em massa / “revisado por”
- Mudança de pesos ou códigos no generator (lote Santos permanece congelado)

## Proibições explícitas

- **Não inventar** decomposição do score se não existir no contrato.
- **Não inventar** endereço, data de coleta ou origem por campo sem dado.
- **Sem migration** nesta fatia.
- **Sem redesign amplo** do Lead Detail.
- **Sem alteração no generator** nesta fatia.

## Menor implementação

Adapter/view-model (`parseLeadIntelligence`) + catálogo de sinais + sanitização
de notes + ajustes pontuais na UI + testes. Sem migration.

## Critério de aceite

> Em cinco leads reais, nenhuma informação técnica ou duplicada aparece, e o
> comercial consegue explicar a oportunidade em menos de 15 segundos usando
> somente a tela.

## Validação

- **Owner técnico:** engenharia (checklist 5 leads + CI)
- **Owner de produto:** sócio comercial (demo final)
- **Como:** preview/produção → abrir 5 leads do lote → checklist do critério de aceite

### Gate técnico — **ACCEPTED — 5/5**

| # | Lead | Sem `Score: … (HIGH)` | Demais critérios Fatia 1 |
| --- | --- | --- | --- |
| 1 | Centro Santista de Odontologia | PASS | PASS (após #50) |
| 2 | Comsorriso | PASS | PASS (após #50) |
| 3 | Clínica Brasil Sorriso - Gonzaga | PASS | PASS (após #50) |
| 4 | Lux Estética Odontológica Santos | PASS | PASS (após #50) |
| 5 | Drª Ariany de França Ferreira | PASS | PASS (após #50) |

**Validações automáticas (#50):**

- `pnpm test` — **118 pass**
- `pnpm typecheck` — ok
- `pnpm lint` — 0 erros

**Correção complementar:** [#50](https://github.com/TraffikPro/prospecta/pull/50) — remove a linha completa de score/prioridade em `sanitize-notes.ts` (sem substituir por PT; demais notas preservadas).

### Gate de produto — demo comercial

- **Status:** `PENDING` — único gate restante antes de encerrar a iniciativa
- Após aprovação: comparar os cinco leads → escolher clínica-modelo → portfólio **Presença, Conversão e Operação**

## Evidência que mudaria o DEFER

Contrato do generator passando `address` / `collectedAt` / breakdown confiável;
feedback pós-demo pedindo ativos vs oportunidades ou rastreabilidade de score.
