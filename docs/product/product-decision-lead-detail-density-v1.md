# Lead Detail Density v1 — Decision

- **Data:** 2026-07-24
- **Decisão:** **DONE** — BUILD REDUCED (rail density only)
- **Classificação:** WORKSPACE
- **Grill:** [product-grill-lead-detail-density-v1.md](product-grill-lead-detail-density-v1.md) — merge [#39](https://github.com/TraffikPro/prospecta/pull/39) @ `e5f2a90`
- **Predecessor:** [Lead Detail Redesign Fatia A DONE](product-decision-lead-detail-redesign-v1.md) ([#37](https://github.com/TraffikPro/prospecta/pull/37))
- **Rota:** `/app/leads/[id]` (rail operacional apenas)
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `0f22415` (merge [#41](https://github.com/TraffikPro/prospecta/pull/41))
- **Smoke:** `scripts/smoke-lead-detail-density-prod.mjs` — OVERALL PASS
- **Evidência BUILD:** `docs/product/assets/lead-detail-density-v1-build/`
- **Baseline grill:** `docs/product/assets/lead-detail-density-v1/measurements.json`

## Product Decision

```text
Lead Detail Redesign v1
    Fatia A — DONE (composição)
    → Lead Detail Density v1: DONE
         (= Fatia B do redesign, escopo reduzido ao rail)
```

---

## Entrega — DONE

| Item | Valor |
|------|-------|
| PR | [#41](https://github.com/TraffikPro/prospecta/pull/41) → merge `0f22415` |
| Branch | `feat/lead-detail-rail-density` |
| Commit | `00e6802` — `feat(leads): compact lead detail operational rail` |
| Deploy Production | Ready @ `0f22415` |
| Smoke prod | `scripts/smoke-lead-detail-density-prod.mjs` — **OVERALL PASS** |

### Antes → depois (1440×900, estado normal)

| Bloco | Antes (Fatia A prod) | Depois | Δ |
|-------|---------------------:|-------:|--:|
| Next Action | 251px | 103px | −148 |
| Contato | 133px | 62px | −71 |
| Alterar etapa | 218px | 127px | −91 |
| Stage `y` | 912 | 636 | −276 |
| Select `bottom` | >900 | **708** | na dobra |

### Smoke produção (confirmado)

- Desktop normal: heading + select na 1ª dobra (`select.bottom` 708 ≤ 900)
- Sticky → unstick: seleção preservada
- LOST + `lostReason`
- Overdue: alerta “Follow-up atrasado” integral
- Mobile 390×844: sem overflow; ordem intacta; sticky=false
- Domínio: sem schema / action / service

### Screenshots

- `docs/product/assets/lead-detail-density-v1-build/desktop-1440x900-normal.png`
- `docs/product/assets/lead-detail-density-v1-build/desktop-1440x900-overdue.png`
- `docs/product/assets/lead-detail-density-v1-build/mobile-390x844.png`
- Probe zoom 200%: `desktop-1440x900-next-action-zoom-200.png`
- Medidas: `validation.json`

Validação local reproduzível: `scripts/validate-lead-detail-density.mjs`

---

## Escopo autorizado — BUILD REDUCED (histórico)

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

O botão **“Salvar etapa”** pode ficar abaixo da dobra.

### Follow-up atrasado — exceção

```text
estado normal
→ stage heading + select na dobra

estado overdue
→ stage pode descer; alerta overdue tem prioridade
```

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

## Aceite — cumprido

| Check | Resultado |
|-------|-----------|
| Desktop 1440×900 normal — heading + select na dobra | PASS (prod smoke) |
| Overdue alerta integral | PASS |
| Mobile ordem / overflow / sticky=false | PASS |
| Sticky/unstick preserva seleção | PASS |
| LOST + `lostReason` | PASS |
| Domínio intacto | PASS |
| E2E afetados | PASS (flake isolado `my-leads` filter URL — PASS no retry) |

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

DONE após merge, deploy Production e smoke da meta principal + complementares — **cumprido** em 2026-07-24/25.
