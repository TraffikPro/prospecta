# ADR 0011 — ADOPT CHAKRA UI ONLY (v3)

> Nome do arquivo mantido por estabilidade de links.

- **Status:** accepted (migration complete)
- **Data:** 2026-07-23 (reaberta: Chakra-only) · concluída 2026-07-23
- **Relacionado:** [0001-stack-v1.md](./0001-stack-v1.md), [0004-technical-scaffold.md](./0004-technical-scaffold.md)
- **Product Decision:** [product-decision-ui-stack-keep-tailwind.md](../product/product-decision-ui-stack-keep-tailwind.md)
- **Plano:** [chakra-only-migration-plan.md](../product/chakra-only-migration-plan.md)

## Contexto

Dual stack (Chakra para Intelligence + Tailwind legado) reduziu risco no piloto.
Com Inbox + CRM + Pipeline + Admin em Chakra, manter Tailwind só aumentava dívida.

## Decisão

**ADOPT CHAKRA UI ONLY** — Chakra UI v3 é o único design system oficial.

```text
Prospecta UI Stack

Next.js
 +
Chakra UI v3
 +
Design Tokens (src/theme/)
 +
Component Library (src/components/ui/)
```

Tailwind CSS foi **removido** do projeto (deps, PostCSS plugin, `@import` em `globals.css`).

### Permitido

- Componentes / tokens / hooks Chakra
- Extensões de theme (`src/theme/`)
- Wrappers em `src/components/ui/`

### Proibido

- Classes utilitárias Tailwind
- CSS Modules novos
- Componentes híbridos (Tailwind + Chakra)

## Alternativas consideradas

| Opção | Resultado |
| --- | --- |
| Dual stack indefinido | **Rejeitada** — dívida visual |
| Big-bang numa PR | **Rejeitada** — migração por fases |
| Tailwind + shadcn | **Rejeitada** — Chakra já adotado |

## Consequências

- `frontend.mdc` / AGENTS: Chakra-only sem resíduo Tailwind
- Skills `chakra-ui-*` = tooling primário de UI
- Superfícies migradas: Login, Shell, Intelligence, Leads, Pipeline, Admin, Forbidden, `/app`
