# Mobile Experience v1 — Decision BUILD

- **Data:** 2026-07-24
- **Decisão:** **BUILD**
- **Classificação:** WORKSPACE
- **Relacionado:** [product-decision-operational-queue-v1.md](product-decision-operational-queue-v1.md)

## Product Decision

```text
UX Experience Pass (home/DS/Quick Activity): DEFER
    → Mobile Experience v1: BUILD
```

Motivo: distinto de “embelezar desktop”. Objetivo é operar o fluxo comercial com uma mão no celular (WhatsApp/founder-led).

## Escopo autorizado

Fluxo: login → Minha fila → lead → inteligência → Activity → follow-up → fila.

1. AppShell mobile: header compacto + bottom nav (Fila · Inteligência · Pipeline · Mais)
2. MEMBER pós-login → `/app/my-leads`
3. Minha fila: cards 1 coluna, filtros scrolláveis, card clicável, empty por filtro
4. Lead detail: coluna única mobile, hierarquia operacional
5. Intelligence: score topo, pitch recolhível, copiar abordagem
6. Activity: formulário existente otimizado ao toque (sem Quick Activity nova)
7. Pipeline: accordion por stage (sem D&D / 6 colunas)

## Fora

Dashboard, redesign desktop completo, PWA/offline, push, app nativo, WhatsApp auto, score/pipeline/DB rules.

## Hipótese

Mobile-first no fluxo crítico ↑ % de Activities registradas fora do desktop e ↓ abandono por UI.

## Métrica

Fluxo crítico 100% em 390px; 0 overflow horizontal; Activity &lt; 60s; operadores: “consigo operar só pelo celular?”
