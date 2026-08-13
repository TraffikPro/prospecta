# Status canônico — Prospecta (pós-MVP)

- **Data:** 2026-08-13
- **Repo canônico:** [`TraffikPro/prospecta`](https://github.com/TraffikPro/prospecta)
- **Branch:** `main` @ `e54f85e` (merge [#56](https://github.com/TraffikPro/prospecta/pull/56))
- **Produção:** `https://prospecta-ten-tau.vercel.app` (deploy success de `e54f85e`)
- **PRs:** merged até #56 (#18 é issue; #48 é draft)
- **Decisão de estágio:** MVP técnico **DONE** · navegação comercial **DONE** · carteira semanal Fase 1 **DONE** / produção · próximo passo produto = **operação semanal real** (não expansão de features)

Este documento substitui narrativas de “scaffold técnico”. Não autoriza feature code por si só.

Sequência oficial: [product-decision-operational-sequence-after-nav.md](product-decision-operational-sequence-after-nav.md).

---

## Veredito

Prospecta é um **MVP operacional em produção**, agora com **IA comercial** e **carteira semanal Fase 1**.

O gargalo atual **não** é construir F2, dashboard, API de KPIs ou badges. O produto entrou na fase de **operação semanal real**: configurar meta, atribuir HIGH, tratar com WhatsApp/e-mail e observar uma semana completa.

```text
NAV              DONE     PR #55
WEEKLY F1        DONE     PR #56 / produção
F2–F4            DEFER
DASHBOARD/KPIs   DEFER
BADGES           DEFER
```

Não existe motor operacional completo em BUILD. Lazy enrollment **não** faz parte da Fase 1. Minha fila é **read-only** (não cria carteira). `PortfolioSummary` é suficiente; sem snapshot/API de dashboard sem grill novo.

---

## Capacidade entregue (resumo)

| Área | Estado | Evidência |
| --- | --- | --- |
| Auth (sessão HttpOnly, ACL `ADMIN`/`MEMBER`) | DONE | ADR 0005 · e2e `auth` |
| Recuperação + troca obrigatória de senha | DONE | ADR 0012/0013 · PRs #10, #31–#34 |
| Auth visual (login / recovery / first access) | DONE | PRs #28–#34 · smokes prod |
| Lead + Activity + Pipeline + handoff `wa.me`/`mailto` | DONE | services/actions · e2e |
| Ingestão `POST /api/internal/leads` + Places/Intelligence | DONE | ADR 0009/0010 · `/app/intelligence` |
| Minha fila `/app/my-leads` | DONE | PRs #8, #11; F1: read-only quanto a assignment |
| Navegação comercial (sidebar / Visão geral / Equipe) | DONE | PR [#55](https://github.com/TraffikPro/prospecta/pull/55) |
| Carteira semanal Fase 1 | DONE | PR [#56](https://github.com/TraffikPro/prospecta/pull/56) · `e54f85e` |
| Chakra-only + mobile + breadcrumbs + visual foundation | DONE | PRs #1–#5, #12–#19, #22–#27 |
| Portfolio comercial (demos) | DONE | PRs #20–#21 |
| Lead Detail Redesign Fatias A+B+C | DONE | PRs #37–#46 · smoke **OVERALL PASS** |
| Lead Detail Commercial Clarity Fatia 1 | DONE | PRs [#49](https://github.com/TraffikPro/prospecta/pull/49)–[#51](https://github.com/TraffikPro/prospecta/pull/51) · gate **ACCEPTED — 5/5** |
| Acquisition Self-Serve (`/admin/acquisition`) | DONE | PRs [#53](https://github.com/TraffikPro/prospecta/pull/53), [#54](https://github.com/TraffikPro/prospecta/pull/54) · [ADR 0014](../adr/0014-acquisition-runner-contract.md) |
| Equipe (`/admin/users`) | DONE | lista + `canRunAcquisition` + meta semanal (F1) |
| Hygiene / anti-mutação em produção | DONE | `production-mutation-guard` · scripts |

Última entrega formal: **Weekly Lead Portfolio Fase 1** + navegação comercial. Demo comercial do lote Santos permanece **VALIDATE** em paralelo; não autoriza F2 nem dashboard.

---

## Auditoria pós-MVP

### 1. Operabilidade do piloto

- Produção e papéis `ADMIN`/`MEMBER` operáveis.
- Carteira Fase 1 em produção: meta por operador, assignment manual, tratado = outreach com outcome após `assignedAt`.
- Lote **Santos Odontologia** permanece **VALIDATE** — [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md). Não é mais o gatilho de dashboard.
- [pilot-day-1-checklist.md](pilot-day-1-checklist.md) permanece checklist operacional.

### 2. Fluxo aquisição → resultado

```text
Places / generator → POST /api/internal/leads → Intelligence Inbox
  → ADMIN atribui à carteira semanal → Minha fila
  → Lead Detail → WhatsApp / e-mail → Activity → Pipeline
  → WON / LOST
```

- Caminho técnico da Fase 1: completo.
- Reciclagem / pool / completar carteira / cron: **DEFER** (Fases 2–4).
- Caminho comercial: em validação na primeira semana operacional real.

### 3. Segurança e confiabilidade

- Sessão server-side, reset token, `mustChangePassword`, Bearer de import, hygiene/reset com travas.
- Issue aberta: [#18](https://github.com/TraffikPro/prospecta/issues/18) — hydration `ColorModeProvider` (não bloqueia o piloto).
- CI GitHub Actions **ausente** na `main` (risco de regressão fora do processo manual PR + smoke).

### 4. Importação CSV e administração

| Item | Estado |
| --- | --- |
| Enum `LeadSource.IMPORT` | no schema |
| UI de upload/mapping CSV | **não implementada** |
| Ingestão máquina | `import-token` + `POST /api/internal/leads` |
| Admin Equipe | lista + aquisição + meta semanal |
| Invite / deactivate | **não na UI** |

CSV deixou de ser o hub (ADR 0009). Só reabre com sintoma real do piloto.

### 5. Métricas de uso e conversão

- **Dashboard = DEFER** — [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md).
- Observação da Fase 1: `PortfolioSummary` na Minha fila (`meta / atribuídos / tratados / pendentes`).
- Sem `GET /api/dashboard/weekly` e sem persistir `weeklyProgress`.
- Reabrir grill de dashboard só após **uma semana operacional real**, se MEMBER não souber o que atacar ou ADMIN não souber quem está ocioso.

### 6. Currículo / case GitHub

- Case de **engenharia de produto** já utilizável: grill → decision → BUILD REDUCED → smoke prod.
- Portfolio com disclaimer (modelo / site-conceito — não case de cliente).
- Case comercial (“gerou reunião/venda”) ainda depende de evidência do piloto.

---

## Explicitamente fora agora (não autorizar)

- Fases 2–4 da carteira (pool, reciclagem, cap 2, completar, runner/callback, cron)
- Lazy enrollment (exige nova decisão)
- Dashboard / KPIs em `/app` / snapshot HTTP
- Badges de menu
- Entidade Campaign / Workspace completo
- CSV UI sem fricção observada
- Reabrir auth/login ou polish de Lead Detail sem sintoma

---

## Próximos passos (ordem)

| Prioridade | Ação | Tipo |
| --- | --- | --- |
| P0 | Completar **uma semana operacional real** da Fase 1 (meta + atribuições + tratamentos) | **VALIDATE** |
| P1 | Observar as perguntas do [evento de revisão](product-decision-operational-sequence-after-nav.md#evento-de-revisão) | Ops / Product |
| P1 | Lote Santos / oferta (Presença, Conversão e Operação) segue em paralelo | VALIDATE |
| P2 | Grill **Fase 2** somente com evidência da semana (ex.: leads que precisam circular) | DEFER até evidência |
| P2 | Issue #18 + CI Actions | Tech debt |

**Checkpoint:** não é merge, deploy nem passagem de tempo. É completar a semana.

**Hipótese ativa:** se ADMIN montar a semana e MEMBER tratar pela fila, `treated / assigned` passa a medir trabalho real — e só então o próximo grill tem evidência.

Até essa evidência, a decisão correta é **VALIDATE / operar**, não **BUILD** de F2, home ou badges.

---

## Fontes

| Doc | Uso |
| --- | --- |
| [product-decision-operational-sequence-after-nav.md](product-decision-operational-sequence-after-nav.md) | Estado oficial NAV / F1 / F2–F4 / dashboard / badges |
| [product-decision-weekly-lead-portfolio-phase-1.md](product-decision-weekly-lead-portfolio-phase-1.md) | Contrato da Fase 1 |
| [product-decision-commercial-nav-ia-v1.md](product-decision-commercial-nav-ia-v1.md) | Navegação DONE |
| [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md) | Dashboard DEFER (gatilho = semana operacional) |
| [founder-pilot.md](founder-pilot.md) | Tese do piloto |
| [founder-pilot-execution.md](founder-pilot-execution.md) | Manual dos sócios |
| [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md) | Lote oficial VALIDATE |
| [prospecta-lead-detail-commercial-clarity.md](prospecta-lead-detail-commercial-clarity.md) | Gate técnico ACCEPTED 5/5 |
| [`docs/product.md`](../product.md) | Normas V1 |
