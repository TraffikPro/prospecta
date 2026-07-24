# ADR 0011 — ADOPT Chakra UI v3 (incremental; Tailwind legado)

> Nome do arquivo mantido por estabilidade de links. Conteúdo supersede
> KEEP TAILWIND.

- **Status:** accepted
- **Data:** 2026-07-23 (reaberta no mesmo dia)
- **Relacionado:** [0001-stack-v1.md](./0001-stack-v1.md), [0004-technical-scaffold.md](./0004-technical-scaffold.md)
- **Product Decision:** [product-decision-ui-stack-keep-tailwind.md](../product/product-decision-ui-stack-keep-tailwind.md)

## Contexto

A decisão anterior (KEEP TAILWIND) evitava abrir migração sem ganho comercial.
O Prospecta evoluiu para Lead Intelligence + CRM + qualificação + pipeline, com
caminho a SaaS. Telas mais complexas (score, cards de oportunidade, filtros,
estados) justificam um design system. Skills Chakra já estão no repo.

## Decisão

**ADOPT Chakra UI v3** como padrão UI daqui para frente, com **migração
incremental**.

```text
Novas telas / telas tocadas → Chakra
Telas antigas (Tailwind) → legado até serem tocadas
Não apagar Tailwind de uma vez
Não reescrever 100% agora
```

### Foundation (fatia atual)

- `pnpm add @chakra-ui/react @emotion/react` (+ `next-themes` para color mode)
- `src/theme/` — `defineConfig` / `createSystem` + tokens (brand, success, warning, danger, radii)
- `src/components/ui/provider.tsx` — `ChakraProvider` + ThemeProvider
- Componentes base: Button, Card, Input (wrappers finos)
- Root layout App Router com `<Provider>` e `suppressHydrationWarning`

### Próximas fatias (não nesta foundation)

- Lead Intelligence View em Chakra
- Migrar pipeline / lead detail / forms quando tocados
- Evoluir tokens/recipes com uso real

## Alternativas consideradas

| Opção | Resultado |
| --- | --- |
| KEEP TAILWIND indefinidamente | **Superseded** — insuficiente para design system do estágio atual |
| Big-bang: remover Tailwind e reescrever tudo | **Rejeitada** — risco alto, sem ganho imediato no piloto |
| Tailwind + shadcn agora | **Adiada** — Chakra escolhido; skills e a11y alinhados |

## Consequências

- `frontend.mdc` e agentes: Chakra = padrão; Tailwind = legado
- Skills `chakra-ui-*` passam a ser tooling primário de UI
- Dual stack temporário (Tailwind + Chakra) até migração gradual
- ADR 0004 atualizado: scaffold ainda menciona Tailwind histórico; UI padrão = Chakra

## Fora deste ADR

- Implementação completa da Lead Intelligence View
- Remoção definitiva do Tailwind
- Dashboard/analytics complexo
