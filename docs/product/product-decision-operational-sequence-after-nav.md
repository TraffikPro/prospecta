# Product Decision — Sequência operacional após a navegação

- **Data:** 2026-08-13
- **Decisão:** **DONE** navegação e carteira Fase 1 · **DEFER** Fases 2–4, dashboard/KPIs, badges
- **Classificação:** PLATFORM (assignment / semana) · WORKSPACE (Minha fila, Equipe, `/app`)
- **Relacionado:**
  - [Commercial Navigation IA](product-decision-commercial-nav-ia-v1.md) — PR [#55](https://github.com/TraffikPro/prospecta/pull/55) **DONE**
  - [Weekly Lead Portfolio Fase 1](product-decision-weekly-lead-portfolio-phase-1.md) — PR [#56](https://github.com/TraffikPro/prospecta/pull/56) **DONE** / produção (`e54f85e`)
  - [Dashboard DEFER](product-decision-dashboard-defer.md)

## Product Decision

```text
NAV              DONE
WEEKLY F1        DONE / produção
F2–F4            DEFER
DASHBOARD/KPIs   DEFER
BADGES           DEFER
```

Não existe “motor operacional completo” em BUILD. A Fase 1 da carteira semanal está **entregue**. O restante é direção fechada, não autorização de implementação.

O produto entrou na fase de **operação semanal real**, não de expansão imediata de features.

## Travas

```text
PortfolioSummary é suficiente para F1.
Não criar snapshot/API de dashboard sem novo grill.

Minha fila é read-only.
Lazy enrollment não faz parte de F1 e exige nova decisão.
```

`/app` permanece Visão geral simples (título + CTA para a fila), não painel executivo.

## Problema

Com a IA e a Fase 1 em produção, o risco é tratar “distribuição semanal” como guarda-chuva e misturar pool, reciclagem, runner, cron, KPIs e `/app` no próximo PR.

## Evidência

- Navegação comercial: merged e em produção (PR #55).
- Carteira Fase 1: merged `e54f85e` e em produção (PR #56). Atribuição **manual** pelo ADMIN; Minha fila **não** cria `LeadAssignment`.
- `PortfolioSummary` já deriva meta / atribuídos / tratados / pendentes das entidades.
- Fases 2–4, dashboard e badges: direção, sem evidência da primeira semana operacional.

## Hipótese

Se o time cumprir **uma semana operacional real** com meta, atribuições e tratamentos, o próximo problema observado autoriza um grill pontual (provavelmente Fase 2). Merge, deploy ou calendário **não** autorizam.

## Sequência

```text
F1 em produção → 1 semana operacional real → grill Fase 2 (ou workspace, se a evidência for essa)
```

Fases 2, 3 e 4 são hipóteses **independentes**:

| Fase | Direção | Decisão |
| --- | --- | --- |
| 2 | Pool HIGH + reciclagem + cap 2 + revisão ADMIN | **DEFER** |
| 3 | Completar carteira + runner + callback com IDs | **DEFER** (refinar contrato do generator antes) |
| 4 | Cron / automação temporal | **DEFER** |

Prioridade cidade/nicho no fill, `AcquisitionJob.requestedBy` e pull MEMBER via runner entram na Fase 3, não na 2.

## Evento de revisão

> **Não é merge, deploy nem passagem de tempo. É completar uma semana operacional real.**

Reavaliar somente após uma semana com:

- meta configurada (`OperatorWeeklyQuota`);
- atribuições reais (`LeadAssignment`);
- tratamentos reais (`WHATSAPP` / `EMAIL` com outcome após `assignedAt`).

Durante essa semana a pergunta **não** é “quais features construir?”, e sim:

- ADMIN consegue montar/distribuir a semana sem atrito?
- MEMBER entende o que deve trabalhar?
- `treated / assigned` representa o trabalho real?
- aparecem leads que precisam voltar para circulação?
- alguém fica sem trabalho enquanto há HIGH disponível?
- ADMIN perde visibilidade sobre capacidade/ociosidade?

Essas evidências determinam se o próximo grill é **Fase 2** ou, excepcionalmente, um problema de workspace. Dashboard/KPIs só reabrem se a dor for “não sei o que atacar” ou “não sei quem está ocioso” — ver [dashboard DEFER](product-decision-dashboard-defer.md).

Fatia candidata **quando** (e se) o grill de home reabrir: `meta / atribuídos / tratados / pendentes`. Isso **não** autoriza implementação agora. Conversão, receita, CAC, ROI, forecast, win rate e velocity permanecem fora.

Badges só depois do dashboard, e só se responderem “preciso olhar isso agora?”.

## Fora

- Motor operacional “completo”
- Snapshot ou `GET /api/dashboard/weekly`
- Home rica / gráficos / KPIs em `/app`
- Lazy enrollment
- “Prioritários” sem definição objetiva
- Misturar F2–F4 num único PR
- Badges de volume (`Leads 184`, `Pipeline 37`)

## Owner / revisão

- Owner: produto (Gustavo) + comercial
- Checkpoint: fim da primeira semana operacional real da Fase 1
