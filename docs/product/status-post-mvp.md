# Status canônico — Prospecta (pós-MVP)

- **Data:** 2026-07-27
- **Repo canônico:** [`TraffikPro/prospecta`](https://github.com/TraffikPro/prospecta)
- **Branch:** `main` @ `d85c8f5` (merge [#46](https://github.com/TraffikPro/prospecta/pull/46))
- **Produção:** `https://prospecta-ten-tau.vercel.app`
- **PRs:** 45 merged (#1–#46; #18 é issue) · 0 abertas
- **Decisão de estágio:** MVP técnico **DONE** em produção · próximo passo = **VALIDATE** (piloto comercial)

Este documento substitui narrativas de “scaffold técnico”. Não autoriza feature code por si só.

---

## Veredito

Prospecta é um **MVP operacional em produção**. Auth, leads, atividades, pipeline, ingestão externa, Intelligence Inbox, filas, Lead Detail (A+B+C) e smokes de produção existem. O gargalo atual **não** é reabrir auth/login nem polish de UI — é **operar o piloto** até evidência de Activity/conversão.

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
| Hygiene / anti-mutação em produção | DONE | `production-mutation-guard` · scripts |

Última entrega formal: **Lead Detail States v1 DONE** ([product-decision-lead-detail-states-v1.md](product-decision-lead-detail-states-v1.md)).

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

- **Dashboard = DEFER** — [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md).
- Observação operacional já possível via Inbox, Minha fila, stages e follow-ups.
- Reabrir grill de dashboard só com volume/dor reais (critérios no defer).

### 6. Currículo / case GitHub

- Case de **engenharia de produto** já utilizável: grill → decision → BUILD REDUCED → smoke prod; assets em `docs/product/assets/` e `docs/pr-assets/`.
- Portfolio com disclaimer (modelo / site-conceito — não case de cliente).
- Case comercial (“gerou reunião/venda”) ainda depende de evidência do piloto.

---

## Explicitamente fora agora (não autorizar)

- Reabrir auth/login como “próxima fatia”
- Nova polish de Lead Detail sem sintoma
- Dashboard / entidade Campaign / Workspace completo
- CSV UI sem fricção observada
- Features sob freeze do lote Santos

---

## Próximos passos (ordem)

| Prioridade | Ação | Tipo |
| --- | --- | --- |
| P0 | Operar lote Santos: Inbox → contato → Activity real (meta: ciclo do lote) | **VALIDATE** |
| P1 | Fechar/assinar Pilot Day 1 com evidência | Ops |
| P2 | Após evidência: novo `product-grill` (Dashboard **ou** edição de lead **ou** admin write **ou** CSV) | Product |
| P2 | Issue #18 + CI Actions | Tech debt |

**Hipótese ativa (piloto):** se o comercial operar os HIGH no Prospecta, gera conversa (Activity → resposta → reunião) sem planilha paralela.

Até essa evidência, a decisão correta é **VALIDATE / operar**, não **BUILD**.

---

## Fontes

| Doc | Uso |
| --- | --- |
| [founder-pilot.md](founder-pilot.md) | Tese do piloto |
| [founder-pilot-execution.md](founder-pilot-execution.md) | Manual dos sócios |
| [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md) | Lote oficial VALIDATE |
| [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md) | Dashboard DEFER |
| [product-decision-lead-detail-states-v1.md](product-decision-lead-detail-states-v1.md) | Última fatia UI DONE |
| [`docs/product.md`](../product.md) | Normas V1 |
