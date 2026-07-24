# Plano — Migração Chakra-only

Referência: [ADR 0011](../adr/0011-ui-stack-keep-tailwind.md)

## Objetivo

```text
Next.js → Chakra UI v3 only
Tailwind → 0 usos → removido
```

## Fases

| Fase | Escopo | Status |
| --- | --- | --- |
| 0 | Foundation + Intelligence View + Inbox | Feito |
| 1 | Login | Feito |
| 2 | Layout autenticado (nav, user, logout) | Feito |
| 3 | Leads lista / new / detail (+ stage/activity no detail) | Feito |
| 4 | Pipeline | Feito |
| 5 | Activity (timeline + form) | Feito no detail (Fase 3) |
| 6 | Admin users + forbidden | Feito |
| 7 | Remover Tailwind + `/app` home residual | Feito (esta fatia) |

## Regras

- Telas: **só Chakra**
- Preferir `src/components/ui/*` + tokens em `src/theme/`
- Sem híbridos Tailwind + Chakra

## Critério de conclusão

- Nenhum `className` utilitário Tailwind em `src/`
- `package.json` sem `tailwindcss` / `@tailwindcss/postcss`
- Smoke: login → Inbox → lead detail → Pipeline → Admin (ACL)
