# Mobile Experience v1 — Decision BUILD → DONE

- **Data:** 2026-07-24
- **Decisão:** **BUILD** → **DONE** (shipped)
- **Classificação:** WORKSPACE
- **PR:** [#12](https://github.com/TraffikPro/prospecta/pull/12) (merged)
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `db5b64e`
- **Relacionado:** [product-decision-operational-queue-v1.md](product-decision-operational-queue-v1.md)

## Product Decision

```text
UX Experience Pass (home/DS/Quick Activity): DEFER
    → Mobile Experience v1: BUILD → DONE
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

## Smoke produção (2026-07-24)

Viewport **390×844** (Playwright mobile / touch) em produção — **OVERALL PASS**:

```text
Login MEMBER → Minha fila
→ filtrar Novo contato
→ abrir lead
→ copiar pitch
→ registrar Activity + follow-up
→ voltar com filtro preservado
→ pipeline (accordion mobile)
→ Mais → logout
→ desktop: nav principal visível, bottom nav oculto
```

Checks automáticos: 0 overflow horizontal (fila/lead/pipeline); CTA salvar alcançável no viewport; bottom nav presente no mobile.

**Aparelho físico (operador):** confirmar em 1 passada notch/safe-area e teclado OS real cobrindo campos — emulação cobre layout 390px, não substitui o toque humano final.
