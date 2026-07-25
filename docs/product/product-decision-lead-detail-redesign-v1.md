# Lead Detail Redesign v1 — Decision

- **Data:** 2026-07-24
- **Decisão:** Fatia A — **DONE** · Fatia B — **DONE** (Density v1 / rail) · Fatia C — **BUILD REDUCED** (states)
- **Classificação:** WORKSPACE (UI operacional do detalhe do lead)
- **Grill (fechado):** [product-grill-lead-detail-redesign-v1.md](product-grill-lead-detail-redesign-v1.md) — merge [#35](https://github.com/TraffikPro/prospecta/pull/35)
- **Rota:** `/app/leads/[id]`
- **Fonte Make:** [Figma Make `5KiDxQt6U8TX1vDg3j1Upz`](https://www.figma.com/make/5KiDxQt6U8TX1vDg3j1Upz/Login-screen-example)
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `866b4f5` (merge [#37](https://github.com/TraffikPro/prospecta/pull/37))
- **Smoke A:** `scripts/smoke-lead-detail-fatia-a-prod.mjs` — OVERALL PASS
- **Relacionado:** [Lead Next Action](product-decision-lead-next-action.md), ADR 0011 (Chakra only)

## Product Decision

```text
Lead Detail Redesign v1

Fatia A — DONE
Composição responsiva e reposicionamento (#37 @ 866b4f5)

Fatia B — DONE (Density v1 — rail only)
[#41](https://github.com/TraffikPro/prospecta/pull/41) @ `0f22415`

Fatia C — BUILD REDUCED (states)
[product-decision-lead-detail-states-v1.md](product-decision-lead-detail-states-v1.md)
```

---

## Fatia A — DONE

### Entrega

- PR [#37](https://github.com/TraffikPro/prospecta/pull/37) → merge `866b4f5`
- Branch: `feat/lead-detail-responsive-composition`
- Commit: `8d88834` — `feat(leads): add dual-column operational lead layout`
- Deploy Production: Ready @ `866b4f5`

### O que entrou

| Item | Resultado |
|------|-----------|
| Largura | `PageFrame` `detailWide` / `containerDetailWide` (~1200px) só no Lead Detail; `detail` global intacto |
| Desktop | Grid ~65/35; main = Intel → Activity → History; rail = Next → Contact → Stage; Origin full-width |
| Mobile | Ordem operacional; sem sticky rail |
| Sticky | Desktop only; **unstick** se altura do grupo > viewport; sem remount de formulários |
| Header | Compacto (nome, etapa, origem, owner, tel/e-mail) |
| Origin | `Collapsible` “Detalhes da origem” (notes + campos secundários) |
| Pitch | Colapsado por padrão; preview `aria-hidden`; Clipboard = pitch completo |
| Domínio | Sem schema / action / service |

### Smoke produção (2026-07-24)

`scripts/smoke-lead-detail-fatia-a-prod.mjs` — **OVERALL PASS**

- Desktop 1440×900: `detailWide`, rail à direita, sticky inicial, **unstick ao reduzir altura**, seleção de etapa preservada, Activity + timeline, sem overflow
- Mobile 390×844: layout, sem sticky, ordem operacional, stage CONTACTED, breadcrumb `← Minha fila` com `filter=new`, sem overflow
- Breadcrumbs prod (`scripts/smoke-breadcrumbs-prod.mjs`): **OVERALL PASS**

### Evidência visual

- `docs/product/assets/lead-detail-fatia-a/desktop-1440x900.png`
- `docs/product/assets/lead-detail-fatia-a/mobile-390x844.png`

### Observação para Fatia B

No desktop 1440×900 com cards atuais (sem densificar), **Alterar etapa** pode ficar abaixo da primeira dobra. Densidade/hierarquia do rail e dos blocos internos = escopo da Fatia B, a partir de **novo grill** medindo a densidade real em produção (não só o Make).

---

## Fatia B — DONE (Density v1 — rail only)

Densidade do **rail operacional** (Next Action, Contato, Alterar etapa) — **sem** mudar schemas/actions/services; Intelligence / Activity / Origin fora do escopo reduzido.

**Grill / Decision / BUILD:** [product-grill-lead-detail-density-v1.md](product-grill-lead-detail-density-v1.md) → [product-decision-lead-detail-density-v1.md](product-decision-lead-detail-density-v1.md) (**DONE**).

- PR [#41](https://github.com/TraffikPro/prospecta/pull/41) → merge `0f22415`
- Smoke: `scripts/smoke-lead-detail-density-prod.mjs` — OVERALL PASS
- Meta: heading + select de “Alterar etapa” na 1ª dobra em `1440×900` (estado normal)

---

## Fatia C — BUILD REDUCED (states)

Empty states explícitos, fallback de Intelligence, copy de “sem próximo passo”, terminais WON/LOST sem urgência residual. Urgência hoje/atrasado **KEEP**.

**Grill / Decision:** [product-grill-lead-detail-states-v1.md](product-grill-lead-detail-states-v1.md) → [product-decision-lead-detail-states-v1.md](product-decision-lead-detail-states-v1.md).

Dependência: A + B **DONE**. BUILD liberado após merge da decision, em branch exclusiva.

---

## Regra de DONE

Cada fatia só marca **DONE** após merge, deploy Production e smoke confirmados por fatia.
