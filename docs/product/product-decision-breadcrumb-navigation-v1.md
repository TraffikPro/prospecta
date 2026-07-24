# Breadcrumb Navigation v1 — Decision BUILD

- **Data:** 2026-07-24
- **Decisão:** **BUILD**
- **Classificação:** PLATFORM
- **Relacionado:** [product-decision-mobile-experience-v1.md](product-decision-mobile-experience-v1.md)

## Product Decision

```text
Mobile Experience v1: DONE
    → Breadcrumb Navigation v1: BUILD
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
