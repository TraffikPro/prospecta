# Breadcrumb Navigation v1 — Decision BUILD → DONE

- **Data:** 2026-07-24
- **Decisão:** **BUILD** → **DONE** (shipped)
- **Classificação:** PLATFORM
- **PR:** [#14](https://github.com/TraffikPro/prospecta/pull/14) (merged)
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `39223ae`
- **Relacionado:** [product-decision-mobile-experience-v1.md](product-decision-mobile-experience-v1.md)

## Product Decision

```text
Mobile Experience v1: DONE
    → Breadcrumb Navigation v1: BUILD → DONE
```

## Problema

Após Mobile Experience, o operador sabe ir às áreas principais pela bottom nav, mas perde contexto ao abrir Lead Detail / Novo lead / Admin — “de onde vim?” e “como volto com o filtro?”.

## Evidência

Hipótese operacional pós-mobile: links soltos no topo do lead e retorno só via `from=queue` não cobrem Inteligência/Pipeline/Leads. Sem evidência quantitativa; menor implementação de navegação contextual.

## Hipótese

Trilha + voltar contextual ↓ abandono/confusão ao sair do detalhe e ↑ retorno correto à fila filtrada / origem.

## Comportamento esperado

- Desktop/tablet: breadcrumb completo (máx. 3 níveis).
- Mobile: `← origem` (bottom nav permanece a navegação principal).
- Lead Detail: `?from=` allowlist + `filter` preservado; sem open redirect.

## Métrica

E2E: fila filtrada → lead → breadcrumb → voltar com `?filter=`; 0 overflow em 390px.

## Escopo / Fora

In: rotas autenticadas listadas; origem allowlisted.  
Out: histórico global, auth pages, menus dropdown, auto-pathname, redesign shell, regras de domínio.

## Smoke produção (2026-07-24)

**OVERALL PASS** em `https://prospecta-ten-tau.vercel.app` (`scripts/smoke-breadcrumbs-prod.mjs`):

```text
PASS  Minha fila?filter=new → lead → ← Minha fila (filtro ok)
PASS  Inteligência → lead → ← Inteligência
PASS  Pipeline → lead → ← Pipeline
PASS  Leads → Novo lead → Leads
PASS  voltar do navegador preserva filter da fila
PASS  origem inválida cai em Leads
PASS  bottom nav presente no mobile
PASS  mobile: back compacto / sem overflow / ← Minha fila com filtro
PASS  mobile novo lead: sem overflow
PASS  Mais → Usuários → Mais
```
