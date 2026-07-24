# Plano — Migração Chakra-only

Referência: [ADR 0011](../adr/0011-ui-stack-keep-tailwind.md)

## Objetivo

```text
Next.js → Chakra UI v3 only
Tailwind → 0 usos → remover deps/config
```

## Fases

| Fase | Escopo | Status |
| --- | --- | --- |
| 0 | Foundation + Intelligence View + Inbox | Feito |
| 1 | Login | Feito (esta fatia) |
| 2 | Layout autenticado (nav, user, logout) | Feito (esta fatia) |
| 3 | Leads lista / new / detail (+ stage/activity no detail) | Feito |
| 4 | Pipeline | Pendente |
| 5 | Activity (timeline + form) | Pendente |
| 6 | Admin users | Pendente |
| 7 | Remover Tailwind (`tailwindcss`, `@tailwindcss/postcss`, `globals.css` import) | Pendente |

## Regras

- Telas novas / migradas: **só Chakra**
- Não introduzir híbridos
- Preferir `src/components/ui/*` + tokens em `src/theme/`
- Uma fase por PR quando possível; validar `lint` / `typecheck` / `build` + E2E auth relevante

## Critério de conclusão

- Nenhum `className` utilitário Tailwind em `src/`
- `package.json` sem `tailwindcss` / `@tailwindcss/postcss`
- Smoke: login → Inbox → lead detail → Activity
