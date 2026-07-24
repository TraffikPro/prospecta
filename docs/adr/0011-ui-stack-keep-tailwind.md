# ADR 0011 — ADOPT CHAKRA UI ONLY (v3)

> Nome do arquivo mantido por estabilidade de links.

- **Status:** accepted
- **Data:** 2026-07-23 (reaberta: Chakra-only)
- **Relacionado:** [0001-stack-v1.md](./0001-stack-v1.md), [0004-technical-scaffold.md](./0004-technical-scaffold.md)
- **Product Decision:** [product-decision-ui-stack-keep-tailwind.md](../product/product-decision-ui-stack-keep-tailwind.md)
- **Plano:** [chakra-only-migration-plan.md](../product/chakra-only-migration-plan.md)

## Contexto

Dual stack (Chakra para Intelligence + Tailwind legado) reduziu risco no piloto.
Com Inbox + View em Chakra, o produto virou plataforma operacional: dois sistemas
visuais aumentam dívida e reduzem velocidade. Ainda há poucas telas — migração
completa controlada é barata agora.

## Decisão

**ADOPT CHAKRA UI ONLY** — Chakra UI v3 é o único design system oficial.

```text
Chakra UI v3 = único sistema visual oficial

Tailwind:
migração incremental até remoção completa
(não legado indefinido)
```

### Permitido

- Componentes / tokens / hooks Chakra
- Extensões de theme (`src/theme/`)
- Wrappers em `src/components/ui/`

### Proibido em telas novas ou migradas

- Classes Tailwind novas
- CSS Modules novos
- Componentes híbridos (Tailwind + Chakra na mesma superfície)

### Ordem de migração (controlada)

1. Login  
2. Layout autenticado (shell)  
3. Leads (lista / new / detail shell)  
4. Pipeline  
5. Activity  
6. Admin  
7. Remover Tailwind (`package.json`, `globals.css`, PostCSS) quando uso = 0  

## Alternativas consideradas

| Opção | Resultado |
| --- | --- |
| Dual stack indefinido | **Rejeitada** — dívida visual; Chakra já prova valor |
| Big-bang reescrever tudo numa PR | **Rejeitada** — risco alto; preferir fases |
| Tailwind + shadcn | **Rejeitada** — Chakra já adotado + skills |

## Consequências

- `frontend.mdc`: Chakra-only; Tailwind só em telas ainda não migradas
- Skills `chakra-ui-*` = tooling primário
- Comercial continua operando Inbox durante a migração (sem bloquear lote)
- Remoção do Tailwind só após fases 1–6 sem classes restantes

## Fora deste ADR

- Dashboard / analytics
- Redesign visual de marca além dos tokens existentes
