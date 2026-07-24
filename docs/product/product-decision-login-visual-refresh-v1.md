# Login Visual Refresh v1 — Decision BUILD → DONE

- **Data:** 2026-07-24
- **Decisão:** **BUILD** → **DONE** (shipped + smoke produção confirmado)
- **Classificação:** WORKSPACE
- **PR:** [#28](https://github.com/TraffikPro/prospecta/pull/28) (merged)
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `82725a5`
- **Fonte visual:** Figma Make `5KiDxQt6U8TX1vDg3j1Upz` (referência estrutural, não pixel-perfect)
- **Relacionado:** [Auth Experience v1](product-decision-auth-experience-v1.md), [Visual Foundation v1](product-decision-visual-foundation-v1.md), ADR 0011 (Chakra only)

## Product Decision

```text
Auth Experience v1 (Fatias 1–3): shipped
    → Login Visual Refresh v1: BUILD → DONE
```

## Escopo entregue

1. Shell responsivo `/login`: desktop split ~55/45 + mobile top bar
2. `AuthShell`, `AuthBrandPanel`, `ProspectaMark`, `PipelineGraphic` (SVG inline)
3. Copy: marca Prospecta + “por DevFlow Labs”; H1 “Bem-vindo de volta”
4. Card `maxW=440px`, tokens Chakra (`radii.card`, `brand.*`, tipografia do theme)
5. E2E `e2e/login-visual.spec.ts` + smoke prod `scripts/smoke-login-visual-prod.mjs`

## Preservar (confirmado)

- `loginAction`, redirects, sessão expirada, credenciais inválidas
- Autocomplete (`username` / `current-password`) e link forgot real
- Sem Inter global, sem Tailwind/shadcn/Lucide, sem Demo de estados
- Forgot / reset / change-password intactos

## Fora

- Frames Figma Design pixel-perfect
- Adoção global de Inter
- Tags promocionais / footer de confiança do Make
- Correção de hydration `ColorModeProvider` (#18)

## Smoke produção (2026-07-24)

Script: `scripts/smoke-login-visual-prod.mjs` (UI em `/login`; login opcional se houver credenciais de env).

| Check | Resultado |
|--------|-----------|
| Deploy Production contém `#28` (`82725a5`) | PASS |
| Desktop `1440×900` — brand panel, split ~55%, card 440px | PASS |
| Desktop — H1, CTA 1ª dobra, session-expired + erro, forgot | PASS |
| Mobile `390×844` — top bar, 1 wordmark, sem brand panel | PASS |
| Mobile — CTA 1ª dobra, sem overflow horizontal | PASS |
| Login opcional → `/app` | PASS |

**OVERALL PASS**

## Regra

DONE só após merge, deploy Production e smoke desktop + mobile confirmados.
