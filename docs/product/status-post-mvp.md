# Status canônico — Prospecta (pós-MVP)

- **Data:** 2026-08-17
- **Repo canônico:** [`TraffikPro/prospecta`](https://github.com/TraffikPro/prospecta)
- **Branch:** `main` @ `18856f0` (merge [#65](https://github.com/TraffikPro/prospecta/pull/65))
- **Produção:** `https://prospecta-ten-tau.vercel.app`
- **PRs:** merged até #65
- **Decisão de estágio:** MVP técnico **DONE** · sistema semanal F1–F4 / KPIs / dashboard / badges **DONE** · playbook WhatsApp **VALIDATE** · **mapa de telas FREEZE** — próximo passo = **executar** Minha fila → lead → Activity

Este documento substitui narrativas de “scaffold técnico”. Não autoriza feature code por si só.

---

## Veredito (17 ago 2026)

Prospecta é um **MVP operacional em produção** com carteira semanal e playbook no detalhe do lead. O gargalo **não** é reabrir o motor nem ampliar a superfície de telas — é a **execução comercial** no caminho:

```text
login → Minha fila → detalhe do lead → playbook WhatsApp → contato manual → Activity
```

Mapa: [product-decision-pilot-screen-map.md](product-decision-pilot-screen-map.md).

`/app` (Visão geral) é suporte de KPI, **não** o centro da operação.

---

## Capacidade entregue (resumo)

| Área | Estado | Evidência |
| --- | --- | --- |
| Auth (sessão HttpOnly, ACL `ADMIN`/`MEMBER`) | DONE | ADR 0005 · e2e `auth` |
| Recuperação + troca obrigatória de senha | DONE | ADR 0012/0013 · PRs #10, #31–#34 |
| Auth visual (login / recovery / first access) | DONE | PRs #28–#34 · smokes prod |
| Lead + Activity + Pipeline + handoff `wa.me`/`mailto` | DONE | services/actions · e2e |
| Ingestão `POST /api/internal/leads` + Places/Intelligence | DONE | ADR 0009/0010 · `/app/intelligence` |
| Minha fila `/app/my-leads` | DONE | PRs #8, #11 |
| Chakra-only + mobile + breadcrumbs + visual foundation | DONE | PRs #1–#5, #12–#19, #22–#27 |
| Portfolio comercial (demos) | DONE | PRs #20–#21 |
| Lead Detail Redesign Fatias A+B+C | DONE | PRs #37–#46 · smoke **OVERALL PASS** |
| Lead Detail Commercial Clarity Fatia 1 | DONE | PRs [#49](https://github.com/TraffikPro/prospecta/pull/49), [#50](https://github.com/TraffikPro/prospecta/pull/50), [#51](https://github.com/TraffikPro/prospecta/pull/51) · gate **ACCEPTED — 5/5** |
| Acquisition Self-Serve Fase 1 (`/admin/acquisition`) | BUILD | [product-decision](product-decision-acquisition-self-serve-v1.md) · [ADR 0014](../adr/0014-acquisition-runner-contract.md) |
| Hygiene / anti-mutação em produção | DONE | `production-mutation-guard` · scripts |

Última entrega formal: **Lead Detail Commercial Clarity Fatia 1** ([prospecta-lead-detail-commercial-clarity.md](prospecta-lead-detail-commercial-clarity.md)) — gate técnico ACCEPTED; demo comercial PENDING.

---

## Auditoria pós-MVP

### 1. Operabilidade do piloto

- Produção e papéis `ADMIN`/`MEMBER` operáveis.
- Lote **Santos Odontologia** em **VALIDATE** — ver [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md).
- Freeze de produto até evidência do primeiro ciclo de contato (Activity real).
- [pilot-day-1-checklist.md](pilot-day-1-checklist.md) permanece checklist operacional (assinatura do marco ainda a fechar com evidência).

### 2. Fluxo aquisição → resultado

```text
Places / generator → POST /api/internal/leads → Intelligence Inbox
  → Lead Detail → WhatsApp / e-mail → Activity → Pipeline
  → Portfolio (opcional) → WON / LOST
```

- Caminho técnico: completo.
- Caminho comercial: em validação (sem fechar conversão no lote oficial até Activity real).

### 3. Segurança e confiabilidade

- Sessão server-side, reset token, `mustChangePassword`, Bearer de import, hygiene/reset com travas.
- Issue aberta: [#18](https://github.com/TraffikPro/prospecta/issues/18) — hydration `ColorModeProvider` (não bloqueia o piloto).
- CI GitHub Actions **ausente** na `main` (risco de regressão fora do processo manual PR + smoke).
- `/admin/users` = **somente leitura** (sem invite / role / deactivate na UI).

### 4. Importação CSV e administração

| Item | Estado |
| --- | --- |
| Enum `LeadSource.IMPORT` | no schema |
| UI de upload/mapping CSV | **não implementada** |
| Ingestão máquina | `import-token` + `POST /api/internal/leads` |
| Admin usuários | lista read-only |
| Invite / role / deactivate | **não na UI** |

CSV deixou de ser o hub (ADR 0009). Só reabre com sintoma real do piloto.

### 5. Métricas de uso e conversão

- **Visão operacional semanal `/app` = DONE** — [product-decision-operational-dashboard.md](product-decision-operational-dashboard.md). **Suporte**, não hub da execução.
- **Badges de ação na navegação = DONE** — [product-decision-navigation-badges.md](product-decision-navigation-badges.md).
- **Playbook WhatsApp no lead = VALIDATE UI** — [product-decision-commercial-playbook-ui.md](product-decision-commercial-playbook-ui.md).
- **Mapa de telas = FREEZE** — [product-decision-pilot-screen-map.md](product-decision-pilot-screen-map.md).
- **Dashboard de conversão / campanha = DEFER** — [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md).
- Observação operacional: Minha fila + detalhe do lead; `/app`, Inbox, pipeline e follow-ups apoiam.

### 6. Currículo / case GitHub

- Case de **engenharia de produto** já utilizável: grill → decision → BUILD REDUCED → smoke prod; assets em `docs/product/assets/` e `docs/pr-assets/`.
- Portfolio com disclaimer (modelo / site-conceito — não case de cliente).
- Case comercial (“gerou reunião/venda”) ainda depende de evidência do piloto.

---

## Explicitamente fora agora (não autorizar)

- Reabrir auth/login como “próxima fatia”
- Nova polish de Lead Detail sem sintoma
- Dashboard de conversão / entidade Campaign / Workspace completo
- CSV UI sem fricção observada
- Features sob freeze do lote Santos

---

## Próximos passos (ordem)

| Prioridade | Ação | Tipo |
| --- | --- | --- |
| P0 | Executar cadência WhatsApp nos HIGH (Minha fila → lead → Activity) | **VALIDATE** |
| P1 | Comparar os 5 leads Santos → escolher clínica-modelo | Ops / Product |
| P1 | Validar oferta: portfólio **Presença, Conversão e Operação** | Product |
| P2 | Fechar/assinar Pilot Day 1 com evidência de Activity | Ops |
| P2 | Débito: MEMBER `canRunAcquisition` vê Aquisição na nav, página 403 | Tech / Product |
| P2 | Issue #18 + CI Actions | Tech debt |

**Hipótese ativa (piloto):** se o comercial operar os HIGH no Prospecta, gera conversa (Activity → resposta → reunião) sem planilha paralela.

Até evidência de Activity no caminho CORE, a decisão correta é **VALIDATE / operar**, não **BUILD** de tela nova.

---

## Fontes

| Doc | Uso |
| --- | --- |
| [founder-pilot.md](founder-pilot.md) | Tese do piloto |
| [../commercial/playbook-v1.md](../commercial/playbook-v1.md) | Playbook comercial V1 (ICP + WhatsApp) |
| [product-decision-commercial-playbook-ui.md](product-decision-commercial-playbook-ui.md) | UI operacional do playbook no lead (VALIDATE UI) |
| [founder-pilot-execution.md](founder-pilot-execution.md) | Manual dos sócios |
| [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md) | Lote oficial VALIDATE |
| [product-decision-operational-dashboard.md](product-decision-operational-dashboard.md) | Visão operacional `/app` DONE |
| [product-decision-navigation-badges.md](product-decision-navigation-badges.md) | Badges de ação na nav DONE |
| [product-decision-pilot-screen-map.md](product-decision-pilot-screen-map.md) | Mapa de telas do piloto FREEZE |
| [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md) | Dashboard de conversão DEFER |
| [prospecta-lead-detail-commercial-clarity.md](prospecta-lead-detail-commercial-clarity.md) | Gate técnico ACCEPTED 5/5 · demo PENDING |
| [product-decision-lead-detail-states-v1.md](product-decision-lead-detail-states-v1.md) | Lead Detail States v1 DONE |
| [`docs/product.md`](../product.md) | Normas V1 |
