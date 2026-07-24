# Product Decision — ADOPT CHAKRA UI ONLY

- **Data:** 2026-07-23 (reaberta) · **Concluída:** 2026-07-23
- **Decisão:** **ADOPT CHAKRA UI ONLY** (migração completa; Tailwind removido)
- **Classificação:** PLATFORM
- **ADR:** [0011-ui-stack-keep-tailwind.md](../adr/0011-ui-stack-keep-tailwind.md)
- **Plano:** [chakra-only-migration-plan.md](./chakra-only-migration-plan.md)

## Problema

Dual stack (Chakra + Tailwind) cria inconsistência e dívida enquanto o Prospecta
vira plataforma operacional (Inbox + CRM + pipeline).

## Hipótese

Um único design system (Chakra v3) → telas mais rápidas e consistentes sem
bloquear o lote comercial (migração por fases, poucas telas).

## Decisão

```text
Decision:
ADOPT CHAKRA UI ONLY — complete

Stack:
Next.js + Chakra UI v3 + design tokens + UI wrappers
```

## Resultado

- Fases 0–7 do plano concluídas
- Pacotes `tailwindcss` / `@tailwindcss/postcss` removidos
- Sem classes Tailwind em `src/`

## Fora deste decision

- Dashboard / analytics
- Redesign de marca além dos tokens existentes
