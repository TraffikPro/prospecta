# Auth Visual Consistency v1 — Decision BUILD → DONE

- **Data:** 2026-07-24
- **Decisão:** **BUILD** → **DONE** (Fatias A + B shipped + smoke)
- **Classificação:** WORKSPACE
- **Grill:** [product-grill-auth-visual-consistency-v1.md](product-grill-auth-visual-consistency-v1.md)
- **Baseline:** [Login Visual Refresh v1](product-decision-login-visual-refresh-v1.md)
- **PRs:** [#31](https://github.com/TraffikPro/prospecta/pull/31) (A), [#33](https://github.com/TraffikPro/prospecta/pull/33) (B)
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `3a74053` (inclui A+B)

## Product Decision

```text
Login Visual Refresh v1: DONE
    → Auth Visual Consistency v1: DONE
         Fatia A — forgot + reset: DONE (#31 @ d456ae3)
         Fatia B — change-password: DONE (#33 @ 3a74053)
```

## Fatia A — DONE

- `PublicAuthShell` + painel reduzido (sem PipelineGraphic)
- Card `440px` (desktop); mobile top bar; 1 wordmark
- Anti-enumeração, tokens, Resend, Login/server intactos
- E2E: 11 passed · Smoke: `scripts/smoke-auth-recovery-visual-prod.mjs` OVERALL PASS

## Fatia B — DONE

- `TaskAuthShell` centrado: marca compacta → alerta → form → Sair
- Sem split / Pipeline / copy promocional de recovery
- Gate `mustChangePassword` e logout preservados
- E2E: `first-access-visual` + `must-change-password` — 3 passed
- Smoke prod (sem mutar flag em produção): redirect anônimo → `/login` + regressão PublicAuthShell no forgot — PASS

## Regra

DONE só após merge, deploy Production e smoke confirmados por fatia. UI autenticada do change-password coberta por E2E local (não forçamos `mustChangePassword` em operadores reais de produção).
