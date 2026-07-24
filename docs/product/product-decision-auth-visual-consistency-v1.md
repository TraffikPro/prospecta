# Auth Visual Consistency v1 — Decision

- **Data:** 2026-07-24
- **Decisão:** Fatia A **DONE** · Fatia B **BUILD**
- **Classificação:** WORKSPACE
- **Grill:** [product-grill-auth-visual-consistency-v1.md](product-grill-auth-visual-consistency-v1.md)
- **Baseline:** [Login Visual Refresh v1](product-decision-login-visual-refresh-v1.md)

## Product Decision

```text
Login Visual Refresh v1: DONE
    → Auth Visual Consistency v1
         Fatia A — forgot + reset: DONE (PR #31 @ d456ae3)
         Fatia B — change-password: BUILD
```

## Fatia A — DONE

- `PublicAuthShell` + painel reduzido (sem PipelineGraphic)
- Card `440px` (desktop); mobile fluido com top bar
- Copy anti-enumeração, tokens, Resend, Login e server auth intactos
- E2E: 11 passed · Smoke prod: OVERALL PASS (`scripts/smoke-auth-recovery-visual-prod.mjs`)

## Fatia B — BUILD (autorizada)

- `TaskAuthShell` centrado: marca compacta → alerta → form → Sair
- Sem split / sem Pipeline / sem headline comercial
- Card `440px`; preservar `mustChangePassword` e logout
