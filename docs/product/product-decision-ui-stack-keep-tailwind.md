# Product Decision — ADOPT CHAKRA UI v3 (incremental)

- **Data:** 2026-07-23 (reaberta; supersede KEEP TAILWIND do mesmo dia)
- **Decisão:** **ADOPT CHAKRA v3** — design system daqui para frente; migração gradual
- **Classificação:** PLATFORM
- **ADR:** [0011-ui-stack-keep-tailwind.md](../adr/0011-ui-stack-keep-tailwind.md) (título histórico; conteúdo = adopt)

## Problema

KEEP TAILWIND evitava migração sem ganho. O produto passou a exigir telas mais
ricas (Lead Intelligence, score, pipeline, estados, componentes reutilizáveis) e
caminho a SaaS. Precisamos de design system consistente sem reescrever tudo.

## Hipótese

Adotar Chakra v3 como padrão UI + migrar telas críticas quando tocadas →
componentes acessíveis e tokens estáveis → velocidade e consistência no Lead
Intelligence e operação comercial, sem big-bang.

## Decisão

```text
Decision:
ADOPT CHAKRA UI v3

Strategy:
Incremental — new screens in Chakra; legacy Tailwind until touched.

Chakra skills:
ADOPTED AS PRIMARY UI TOOLING.
```

- **Padrão UI:** Chakra UI v3 (`@chakra-ui/react`)
- **Legado:** Tailwind permanece até migração tela a tela
- **Não fazer agora:** apagar Tailwind, reescrever 100% das telas, dashboard vanity

## Fases

1. **Foundation** — deps, Provider App Router, theme/tokens, Button/Card/Input base
2. **Lead Intelligence View** — primeira tela de alto valor em Chakra
3. **Tokens / receitas** — evoluir brand, success/warning/danger conforme uso real
4. **Migração gradual** — pipeline, lead detail, forms quando forem tocados

## Métrica / validação

- Foundation: `pnpm lint`, `pnpm typecheck`, `pnpm build` verdes
- Próxima fatia de produto: Lead Intelligence View usável pelos sócios no piloto

## Fora desta decisão

- Multi-tenant / billing
- Charts/dashboard complexo antes do fluxo vertical + intelligence view
