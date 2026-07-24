# Lead Detail Redesign v1 — Decision

- **Data:** 2026-07-24
- **Decisão:** Fatia A — **BUILD** · Fatia B — **PLANNED** · Fatia C — **PLANNED**
- **Classificação:** WORKSPACE (UI operacional do detalhe do lead)
- **Grill (fechado):** [product-grill-lead-detail-redesign-v1.md](product-grill-lead-detail-redesign-v1.md) — merge [#35](https://github.com/TraffikPro/prospecta/pull/35) @ `356a77c`
- **Rota:** `/app/leads/[id]`
- **Fonte Make:** [Figma Make `5KiDxQt6U8TX1vDg3j1Upz`](https://www.figma.com/make/5KiDxQt6U8TX1vDg3j1Upz/Login-screen-example)
- **Baseline produção:** `https://prospecta-ten-tau.vercel.app`
- **Relacionado:** [Lead Next Action](product-decision-lead-next-action.md), ADR 0011 (Chakra only)

## Product Decision

```text
Lead Detail Redesign v1

Fatia A — BUILD
Composição responsiva e reposicionamento

Fatia B — PLANNED
Densidade e hierarquia interna dos blocos

Fatia C — PLANNED
Urgência, empty states e smoke final
```

Após o merge deste documento, o **BUILD da Fatia A** fica liberado em **branch exclusiva**, sem commit automático.

---

## Fatia A — BUILD

### Escopo autorizado

Composição responsiva e reposicionamento dos blocos existentes em `/app/leads/[id]`:

| Item | Alvo |
|------|------|
| Grid desktop | ~65% main / ~35% rail |
| Largura | ~`max-width: 1200px` **somente** no Lead Detail (variante/config local; não alterar `PageFrame detail` global) |
| Header | Compacto: nome, etapa, origem, responsável, telefone/e-mail. Campanha/intel fora do header |
| Main | Resumo/Inteligência → Registrar atividade → Histórico → **Detalhes da origem** (`Collapsible`) |
| Rail operacional | Próxima ação → Contato → Alterar etapa |
| Sticky | Só o grupo operacional; **somente desktop**; offset abaixo do header; sem scroll interno; **unstick** se altura > viewport |
| Mobile | Sem sticky rail; ordem abaixo |
| Pitch | Colapsado por padrão; título + indicação + “Ver abordagem” + “Copiar abordagem”; expand acessível por teclado |
| Stage | Reposicionado para o rail (desktop) / ordem mobile; action intacta |

**Ordem mobile (obrigatória):**

```text
Retorno/breadcrumb
Lead header
Próxima ação
Contato
Resumo
Inteligência
Registrar atividade
Histórico
Alterar etapa
Detalhes da origem
```

### Guardrails (Fatia A)

- Nenhuma mudança em **schemas**, **actions** ou **services**.
- Nenhuma alteração nos **dados exibidos** (nenhum campo removido; só reorganização / compactação de apresentação).
- Largura de **1200px** apenas no Lead Detail.
- Sticky somente em **desktop** e somente quando o grupo operacional **couber** na viewport.
- Nenhuma ordem ou comportamento perdido no **mobile**.
- Anchors `#register-activity` e contexto de **breadcrumbs** (`from` / `filter` / `returnHref`) preservados.
- Activity, stage, pitch e copy continuam cobertos pelos **mesmos testes** (E2E/unit existentes devem passar sem relaxar asserts de domínio).

### Explicitamente fora da Fatia A

- Redesign interno de Intelligence, formulário de atividade, Timeline ou badges (densidade = Fatia B).
- Urgência / empty states polish + smoke dedicado (Fatia C).
- AppShell, lista de leads, Inbox, My Queue, Kanban.
- Automações, novos campos, score/ACL, dark mode, Inter global, auth server-side.

### Métricas de sucesso

- Activity visível mais cedo no desktop.
- Ações comerciais (próxima ação / contato / etapa) na primeira dobra útil.
- Mobile sem regressão.
- Nenhuma mudança de domínio.
- Nenhum campo ou comportamento perdido.

### Aceite Fatia A

| Check | Critério |
|-------|----------|
| lint / typecheck / test / build | PASS |
| Testes existentes (activity, stage, pitch, copy) | PASS — mesmos contratos |
| Desktop 1440×900 | Grid ~65/35; rail = Next + Contact + Stage |
| Sticky | Desktop only; unstick se altura > viewport; sem scroll interno |
| Mobile 390×844 | Ordem fixa; sem sticky rail; sem overflow horizontal |
| `#register-activity` + breadcrumbs | Preservados |
| Largura | ~1200px só no detail; outras rotas intactas |
| Domínio | Sem schema/action/service diff |

### Entrega

```text
Branch exclusiva (ex.: feat/lead-detail-dual-column-layout)
PR sugerido: feat(leads): lead detail dual-column operational layout
Sem commit automático pelo agente — BUILD sob pedido explícito após merge desta decisão
```

---

## Fatia B — PLANNED

Densidade e hierarquia interna dos blocos (Next Action, Contact, Intelligence, Origin, Stage) alinhada ao Make — **sem** mudar schemas/actions/services.

Dependência: Fatia A em produção (ou merge estável) antes de iniciar.

---

## Fatia C — PLANNED

Urgência (`due_today` / `overdue`), empty states e smoke visual final (ex.: `scripts/smoke-lead-detail-visual-prod.mjs`).

Dependência: A + B estáveis.

---

## Regra de DONE

Cada fatia só marca **DONE** após merge, deploy Production e aceite da fatia confirmados. Este documento autoriza **BUILD da Fatia A**; não marca A como DONE.
