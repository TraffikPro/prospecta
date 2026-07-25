# Lead Detail Density v1 — Decision

- **Data:** 2026-07-24
- **Decisão:** **BUILD REDUCED** — rail density only
- **Classificação:** WORKSPACE
- **Grill:** [product-grill-lead-detail-density-v1.md](product-grill-lead-detail-density-v1.md) — merge [#39](https://github.com/TraffikPro/prospecta/pull/39) @ `e5f2a90`
- **Predecessor:** [Lead Detail Redesign Fatia A DONE](product-decision-lead-detail-redesign-v1.md) ([#37](https://github.com/TraffikPro/prospecta/pull/37))
- **Rota:** `/app/leads/[id]` (rail operacional apenas)
- **Produção baseline:** `https://prospecta-ten-tau.vercel.app` @ tip pós Fatia A
- **Evidência:** `docs/product/assets/lead-detail-density-v1/measurements.json`

## Product Decision

```text
Lead Detail Redesign v1
    Fatia A — DONE (composição)
    → Lead Detail Density v1: BUILD REDUCED — rail density only
         (= Fatia B do redesign, escopo reduzido ao rail)
```

Após o merge deste documento, o **BUILD** fica liberado em **branch exclusiva**, sem commit automático.

---

## Escopo autorizado — BUILD REDUCED

Somente densidade/hierarquia interna do **rail operacional**:

| Entra | Fora |
|-------|------|
| `LeadNextActionCard` | Header (`LeadInfoCard`) |
| `LeadContactActions` | Intelligence |
| `MoveStageForm` (apresentação) | Activity form |
| Gaps internos e entre cards do rail | Timeline |
| | Detalhes da origem |
| | Grid 65/35 / ordem mobile |

### Meta da primeira dobra (estado normal)

```text
1440×900, estado normal (sem alerta overdue/due_today):
título “Alterar etapa” + select visíveis na primeira dobra
```

O botão **“Salvar etapa”** pode ficar abaixo da dobra, desde que apareça com scroll curto e previsível.

Não exigir card completo + CTA na dobra (compressão excessiva / risco de mudar composição).

### Contato

- Título **“Contato”** permanece **visível** (não `sr-only`).
- Permitido: reduzir margem inferior, tamanho do heading, texto auxiliar, espaçamento entre botões.
- Touch targets **≥ 44px**.

### Follow-up atrasado — exceção

```text
estado normal
→ stage heading + select na dobra

estado overdue
→ stage pode descer; alerta overdue tem prioridade
```

Testes **não** devem esconder ou truncar o alerta para atingir a métrica visual.

### Activity

Fora desta fatia.

---

## Guardrails de densidade

- Nenhum texto necessário removido
- Sem fonte abaixo dos tokens legíveis existentes
- Touch targets ≥ 44px
- Sem trocar cards por ícones sem label
- Sem Tooltip como única explicação
- Alert overdue integral
- Stage: `lostReason`, loading, erro e Toast intactos
- Sticky/unstick da Fatia A permanece
- Mobile: gaps menores ok; **sem** reordenação
- Composição: grid 65/35 e ordem mobile **congelados**
- Sem modal/drawer; sem mudança de domínio; sem esconder campos necessários; sem transformar rail em dashboard
- Sem schema / action / service

---

## Aceite

### Principal

| Check | Critério |
|-------|----------|
| Desktop 1440×900, estado normal | Título “Alterar etapa” + `move-stage-select` visíveis na 1ª dobra (`bottom` do select ≤ 900) |

### Complementares

| Check | Critério |
|-------|----------|
| Overdue | Alerta integral; stage pode sair da dobra |
| Legibilidade | Rail continua legível; sem ícones-only |
| Mobile 390×844 | Sem overflow; ordem intacta; sticky=false; targets ≥ 44px |
| Sticky/unstick | Seleção de stage preservada ao reduzir/restaurar altura |
| Domínio | Nenhuma mudança schema/action/service |
| E2E existentes | Activity / stage / pitch / breadcrumbs PASS |

Smoke sugerido: estender `scripts/smoke-lead-detail-fatia-a-prod.mjs` ou `scripts/smoke-lead-detail-density-prod.mjs` com assert da meta principal.

---

## Entrega

```text
Branch exclusiva (ex.: feat/lead-detail-rail-density)
PR sugerido: feat(leads): densify lead detail operational rail
Sem commit automático — BUILD sob pedido explícito após merge desta decisão
```

---

## Ambiguidades — FECHADAS

| # | Decisão |
|---|--------|
| 1 Meta dobra | Heading + select na dobra; CTA Salvar pode ficar abaixo |
| 2 Contato | Título visível e compacto; sem sr-only; targets ≥ 44px |
| 3 Overdue | Exceção — urgência > meta de dobra |
| 4 Escopo PR | **Somente rail** (Next + Contact + Stage + gaps) |
| 5 Activity | Fora |

---

## Regra de DONE

DONE só após merge, deploy Production e smoke da meta principal + complementares confirmados.
