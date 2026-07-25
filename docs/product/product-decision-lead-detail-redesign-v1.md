# Lead Detail Redesign v1 — Decision

- **Data:** 2026-07-24
- **Decisão:** Fatia A — **DONE** · Fatia B — **PLANNED** · Fatia C — **PLANNED**
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

Fatia B — PLANNED
Densidade e hierarquia interna dos blocos
(requer novo grill com densidade real observada em produção)

Fatia C — PLANNED
Urgência, empty states e smoke final
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

## Fatia B — PLANNED

Densidade e hierarquia interna dos blocos (Next Action, Contact, Intelligence, Origin, Stage) — **sem** mudar schemas/actions/services.

**Próximo passo obrigatório:** abrir **novo Product Grill** usando a densidade real observada em produção pós-Fatia A (primeira dobra, altura do rail, stage sticky/unstick, pitch). Não iniciar BUILD B sem esse grill.

Dependência: Fatia A **DONE** (este doc).

---

## Fatia C — PLANNED

Urgência (`due_today` / `overdue`), empty states e smoke visual final.

Dependência: A + B estáveis.

---

## Regra de DONE

Cada fatia só marca **DONE** após merge, deploy Production e smoke confirmados por fatia.
