# Product Decision — Lead Detail Commercial Clarity (Fatia 1)

- **Data:** 2026-07-28
- **Decisão:** **BUILD** (escopo reduzido)
- **Status:** implementado na branch `feat/lead-detail-commercial-clarity-fatia-1` — aguardando validação com 5 leads do lote + demo comercial
- **Classificação:** WORKSPACE (apresentação/operação do detail) · catálogo de sinais = PLATFORM leve
- **Arquivo de referência:** `prospecta-lead-detail-commercial-clarity`
- **Rota:** `/app/leads/[id]`
- **Relacionado:** [ADR 0010](../adr/0010-lead-intelligence-pipeline.md), [Lead Detail Redesign v1](product-decision-lead-detail-redesign-v1.md), [Intelligence Inbox](product-decision-intelligence-inbox.md)

## Product Decision

```text
Lead Detail Commercial Clarity — Fatia 1 — BUILD (REDUCED)

Proposta completa (P0–P2, 34 itens): REDUCE SCOPE
Fatia 1 (abaixo): BUILD
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

- **Owner:** sócio comercial (demo) + produto/engenharia (checklist técnico)
- **Prazo de observação:** 1 sessão de apresentação + 3 dias de uso na fila
- **Como:** preview → abrir 5 leads do lote → checklist do critério de aceite

## Evidência que mudaria o DEFER

Contrato do generator passando `address` / `collectedAt` / breakdown confiável;
feedback pós-demo pedindo ativos vs oportunidades ou rastreabilidade de score.
