# Product Decision — Operational dashboard `/app`

- **Data:** 2026-08-14
- **Decisão:** **BUILD**
- **Classificação:** WORKSPACE (visão operacional) · PLATFORM (consome o contrato KPI)
- **Branch:** `feat/operational-dashboard-app`
- **Pré-requisito:** [KPIs semanais canônicos](product-decision-commercial-kpis.md) em `main`
- **Não autoriza:** badges, ranking, gráficos históricos, Recharts, filtros de período, forecast, alertas, export, snapshot persistido, `/api/kpis`, Completar carteira no dashboard

## Sequência canônica

```text
F1–F4 = DONE / PRODUÇÃO
KPIs = DONE
DASHBOARD = BUILD agora
BADGES = NEXT
```

Depois do merge:

```text
F1–F4 = DONE
KPIs = DONE
DASHBOARD = DONE
BADGES = NEXT
```

## Relação com o dashboard DEFER

[product-decision-dashboard-defer.md](product-decision-dashboard-defer.md) continua válido para **analytics de conversão** (campanha, funil WON, gráficos). Esta decisão cobre só a **visão operacional semanal** de `/app` sobre o contrato KPI já fechado.

A IA de navegação ([commercial-nav](product-decision-commercial-nav-ia-v1.md)) permanece: `/app` continua **Visão geral**. Esta PR substitui o grid de atalhos da página, não a sidebar.

## Hipótese

Se `/app` mostrar meta, preenchimento, tratados, pendentes e origem da carteira a partir de `getOperatorWeeklyKpis` / `getCommercialWeeklyKpis` — sem recalcular regra na UI — então o operador vê a semana em segundos e vai para a fila, em vez de reconstruir o estado na cabeça.

## Revenue-centric

1. **Objetivo da tela:** responder “como está minha semana?” e levar à ação (tratar pendências / Minha fila). ADMIN vê o agregado do time.
2. **Comportamento atual:** `/app` era um placeholder de atalhos; a sidebar já navega.
3. **Comportamento desejado:** cards + progresso + origem + CTA; MEMBER = próprio; ADMIN = agregado.
4. **Principal fricção:** números da carteira só existiam no service; a home não orientava execução.
5. **Hipótese:** ver pendentes e a taxa canônica reduz o tempo até o próximo tratamento.
6. **Métrica primária (manual no piloto):** operador abre `/app` e descreve meta / pendentes / próximo clique em < 10 s.
7. **Métricas de proteção:** abrir `/app` não cria portfolio, assignment, job nem activity; F1–F4 e KPI suite permanecem verdes; MEMBER não vê agregado.
8. **Menor alteração:** uma leitura KPI por request + formatação; sem API pública.
9. **Risco de regressão:** e2e de auth/visual dependem do H1 “Visão geral” — mantido.
10. **Como validar:** testes de view-model (não recalcular taxa), loader MEMBER/ADMIN/read-only, e2e smoke, `pnpm test` / lint / typecheck / build.
11. **Validation owner:** Sócio de Produto e Tecnologia.
12. **Observation window:** primeira semana de uso após o merge.
13. **Success criterion:** `/app` responde as perguntas da semana sem segunda regra de negócio.
14. **Adjustment criterion:** se a home virar BI informal (ranking, gráfico, filtro), cortar e voltar a cards + CTA.
15. **Rollback or stop:** reverter a página para o heading + CTA da fila; o contrato KPI permanece.

## Contrato de UI

A UI **formata** campos já calculados:

```ts
kpis.treatmentRate
kpis.portfolioFillRate
kpis.treatmentTargetRate
```

A UI **não** faz `treated / assigned`, `target - treated` nem `assignments.filter(...)`.

Unidade = `LeadAssignment`. Semana = `America/Sao_Paulo` via `formatWeekRangePtBr` (helper F1). Taxas `0..1` → `Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 })`.

## Papéis

| Papel | Service | Escopo |
| --- | --- | --- |
| `MEMBER` | `getOperatorWeeklyKpis({ actorId, userId: actorId })` | só o próprio |
| `ADMIN` | `getCommercialWeeklyKpis({ actorId })` | agregado (somas / somas) |

Papel vem da sessão/DB. Sem `?userId=`. Sem seletor de operador. MEMBER não força visão ADMIN.

`quotaConfigured = false` → “Não configurada”, nunca “Meta = 0”. MEMBER não ganha botão de gestão.

## Estrutura

Cards: Meta · Atribuídos · Tratados · Pendentes (pendentes enfatizados quando > 0).

Progresso: carteira preenchida, tratamento da carteira, tratados vs meta (se a quota existe).

Origem: Nova aquisição, Reciclados, Manuais/Outros, Reatribuições — só `bySource` canônico.

`released.weekClosed > 0` → texto discreto “Expiraram sem tratamento: N”. Se 0, oculta. Não é alerta crítico.

CTA MEMBER → `/app/my-leads` (`Tratar pendências` se `pending > 0`). Completar carteira permanece na Minha fila (F3).

CTA ADMIN: `Ver equipe` → `/admin/users`; `Revisar HIGH` → `/admin/high-pool`. No máximo esses dois.

## Fora desta PR

Badges na navegação, ranking, gráficos, filtros, forecast, alertas, export, PDF/CSV, snapshot, analytics mensal, funil, score de operador, Completar carteira no `/app`.

## Read-only

Abrir `/app` não cria nem altera `WeeklyPortfolio`, `LeadAssignment`, `AcquisitionJob`, `Activity` nem quota.

## Próximo corte

Badges de navegação — só depois desta visão estar operável.
