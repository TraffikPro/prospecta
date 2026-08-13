# Dashboard v1 — Decision DEFER

- **Data:** 2026-07-24
- **Atualização:** 2026-08-13
- **Decisão:** **DEFER** (mantida)
- **Classificação:** PLATFORM (quando reabrir)
- **Relacionado:** [sequência operacional](product-decision-operational-sequence-after-nav.md), [carteira Fase 1](product-decision-weekly-lead-portfolio-phase-1.md)

## Status

**DEFERRED** — não autoriza arquitetura nem implementação.

## Motivo

Um painel deve responder uma pergunta operacional **existente**. Com a carteira Fase 1 em produção, essa pergunta só pode aparecer depois de **uma semana operacional real**. Construir `/app` rico ou API de snapshot agora mediria o vazio e desviaria da operação.

## Trava

```text
PortfolioSummary é suficiente para F1.
Não criar snapshot/API de dashboard sem novo grill.
```

`/app` permanece Visão geral simples até um BUILD futuro.

## Condições para reabrir o grill

Reavaliar **após uma semana operacional completa** com:

- meta configurada;
- atribuições reais;
- tratamentos reais.

**Não** reabre por merge, deploy, calendário, lote Santos isolado, nem contagem de Activities.

Reabrir somente se, depois dessa semana, o problema observado for:

- MEMBER não sabe o que atacar; **ou**
- ADMIN não sabe quem está ocioso.

## Regra de produto

> Dashboard deve responder uma pergunta operacional **existente**, não criar uma pergunta nova.

| Evitar | Preferir |
| --- | --- |
| “Vamos fazer gráficos porque SaaS tem dashboard.” | “Depois da semana, o ADMIN não vê quem está ocioso.” |

## Primeira versão esperada (quando BUILD)

Não autoriza implementação agora. Não começar com gráficos. Não criar `GET /api/dashboard/weekly`. Derivar das entidades já usadas em `PortfolioSummary`.

**Fatia 1 candidata:**

```text
meta / atribuídos / tratados / pendentes
```

**Não** começar por:

```text
Leads / Contatados / Reuniões / WON
```

Também fora: conversão, receita, CAC, ROI, forecast, win rate, velocity, BI, filtros complexos, IA analítica.

**Depois (só com uso comprovado da fatia 1):** gráficos, comparações, campanhas, tendências.

## Próximo passo agora

```text
Operar uma semana real da carteira Fase 1
```

O grill de dashboard usa o gargalo observado nessa semana — não o merge do PR #56.

## Histórico (2026-07-24)

DEFER original por falta de volume no lote Santos (Leads 5 / Activities 0). Gatilhos daquela data (5 contatos Santos, ≥3 Activities, segunda campanha) **estão aposentados** e não reabrem o grill.

## Owner / revisão

- Owner: produto (Gustavo) + comercial
- Revisão: ao completar a primeira semana operacional real da Fase 1, se o problema observado for o da seção de reabertura
