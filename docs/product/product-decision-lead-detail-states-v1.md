# Lead Detail States & Urgency v1 — Decision

- **Data:** 2026-07-24
- **Decisão:** **DONE** — BUILD REDUCED (explicit empty and terminal states)
- **Classificação:** WORKSPACE
- **Grill:** [product-grill-lead-detail-states-v1.md](product-grill-lead-detail-states-v1.md) — merge [#43](https://github.com/TraffikPro/prospecta/pull/43) @ `2221e4f`
- **Predecessor:** [Density v1 DONE](product-decision-lead-detail-density-v1.md) ([#41](https://github.com/TraffikPro/prospecta/pull/41)) · [Redesign Fatia A DONE](product-decision-lead-detail-redesign-v1.md)
- **Rota:** `/app/leads/[id]`
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `9ee09b8` (merge [#45](https://github.com/TraffikPro/prospecta/pull/45))
- **Smoke:** `scripts/smoke-lead-detail-states-prod.mjs` — OVERALL PASS
- **Evidência BUILD:** `docs/product/assets/lead-detail-states-v1-build/`

## Product Decision

```text
Lead Detail Redesign v1
    Fatia A — composição          DONE
    Fatia B — densidade           DONE
    Fatia C — estados e urgência  DONE
         (= explicit empty + terminal presentation)
```

---

## Entrega — DONE

| Item | Valor |
|------|-------|
| PR | [#45](https://github.com/TraffikPro/prospecta/pull/45) → merge `9ee09b8` |
| Branch | `feat/lead-detail-states-fatia-c` |
| Commit | `b77659a` — `feat(leads): clarify empty and terminal lead states` |
| Deploy Production | Ready @ `9ee09b8` |
| Smoke prod | `scripts/smoke-lead-detail-states-prod.mjs` — **OVERALL PASS** |

### Matriz entregue

| Estado | Resultado |
|--------|-----------|
| Sem Activity | `AppEmptyState compact` + CTA `#register-activity` |
| Sem telefone/e-mail | “Contato indisponível” + **Registrar atividade** → `#register-activity` |
| Com canal | **Registrar resultado** preservado |
| Aberto sem próximo passo | Follow-up **Não definido** + orientação |
| WON/LOST + FU residual | Sem alert urgência; **`nextFollowUpAt` preservado no banco** |
| MANUAL sem Intelligence | Fallback + “Lead cadastrado manualmente.” |
| GOOGLE_PLACES sem Intelligence | Fallback sem linha Manual |
| Follow-up hoje/atrasado (aberto) | KEEP |

### Smoke produção (confirmado)

- sem Activity
- sem canal + anchor scroll/foco
- WON/LOST sem urgência residual + `nextFollowUpAt` preservado
- MANUAL sem Intelligence
- aberto overdue
- mobile `390×844`

### Evidência

- `docs/product/assets/lead-detail-states-v1-build/`
- Validação local: `scripts/validate-lead-detail-states.mjs`

Domínio: sem schema / action / service.

---

## Escopo autorizado — BUILD REDUCED (histórico)

### IN

1. Sem Activity — `AppEmptyState compact` + CTA opcional `#register-activity`
2. Sem canal — estado neutro; CTA **Registrar atividade** (não “resultado”)
3. Sem próximo passo — “Não definido” + orientação em stages abertos
4. WON/LOST — suppress alerts FU; sem mutar `nextFollowUpAt`
5. Sem Intelligence — fallback compacto; MANUAL com linha extra

### KEEP

Follow-up hoje/atrasado integral (texto + ícone + cor).

### OUT

Forms error polish · edição de lead · recomputar inteligência · limpar `nextFollowUpAt` · animações · A/B · domínio.

---

## Aceite — cumprido

| Check | Resultado |
|-------|-----------|
| Sem `—` ambíguo nos estados tratados | PASS |
| Intelligence fallback explícito | PASS |
| Sem canal sem ação impossível | PASS |
| WON/LOST sem urgência residual | PASS |
| Anchors / teclado (`#register-activity`) | PASS |
| Desktop / mobile sem regressão A/B | PASS |
| Domínio intacto | PASS |

---

## Ambiguidades — FECHADAS

| # | Decisão |
|---|--------|
| 1 Intelligence empty | **IN** — fallback compacto; MANUAL com linha extra |
| 2 Sem próximo passo | “Não definido” + orientação; âncora |
| 3 Sem canal | Neutro; CTA **Registrar atividade** (não edição) |
| 4 Terminais | Suppress alerts FU; sem mutar DB |
| 5 Forms error | **OUT** |
| 6 Urgência hoje/atrasado | **KEEP** |

---

## Regra de DONE

DONE após merge do BUILD, deploy Production e smoke — **cumprido** em 2026-07-24/25.
