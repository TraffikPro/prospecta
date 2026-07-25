# Lead Detail States & Urgency v1 — Decision

- **Data:** 2026-07-24
- **Decisão:** **BUILD REDUCED** — explicit empty and terminal states
- **Classificação:** WORKSPACE
- **Grill:** [product-grill-lead-detail-states-v1.md](product-grill-lead-detail-states-v1.md) — merge [#43](https://github.com/TraffikPro/prospecta/pull/43) @ `2221e4f`
- **Predecessor:** [Density v1 DONE](product-decision-lead-detail-density-v1.md) ([#41](https://github.com/TraffikPro/prospecta/pull/41)) · [Redesign Fatia A DONE](product-decision-lead-detail-redesign-v1.md)
- **Rota:** `/app/leads/[id]`
- **Produção tip:** `https://prospecta-ten-tau.vercel.app` @ tip pós Density / grill states

## Product Decision

```text
Lead Detail Redesign v1
    Fatia A — composição          CONGELADA (DONE)
    Fatia B — densidade           CONGELADA (DONE)
    Fatia C — estados e urgência  BUILD REDUCED
         (= explicit empty + terminal presentation)
```

Após o merge deste documento, o **BUILD** da Fatia C fica liberado em **branch exclusiva**, sem commit automático.

---

## Escopo autorizado — BUILD REDUCED

### IN

#### 1. Sem Activity (Histórico)

`AppEmptyState` **compact**:

```text
Nenhuma atividade registrada

Registre o primeiro contato para iniciar o histórico deste lead.
```

Ação opcional:

```text
Registrar atividade → #register-activity
```

#### 2. Sem canal de contato

Estado **neutro** no bloco Contato (não CTA de edição — operação inexistente):

```text
Contato indisponível

Este lead não possui telefone ou e-mail cadastrado.
```

Manter “Registrar resultado” se já existir (registro de activity não depende de canal externo).

#### 3. Sem próximo passo

Substituir `—` ambíguo por:

```text
Não definido
```

Para **stages abertos** (não WON/LOST), orientação:

```text
Registre uma atividade para definir o próximo passo.
```

Pode apontar para `#register-activity`. Sem nova server action.

#### 4. WON / LOST (terminais) — só apresentação

- Suprimir alerta `due_today` / `overdue`
- Não recomendar novo contato (copy terminal já existente / reforçada)
- Status terminal por **texto + badge**
- Histórico e consulta permanecem
- **Não** apagar `nextFollowUpAt` no banco nesta fatia

#### 5. Sem Intelligence

Fallback compacto **sempre** (nunca omitir silenciosamente):

```text
Inteligência não disponível

Este lead não possui dados de qualificação automática.
```

Para `source === MANUAL`, complementar:

```text
Lead cadastrado manualmente.
```

Sem CTA “Gerar inteligência”.

### KEEP

Follow-up **hoje** e **atrasado** permanecem como estão:

- texto · ícone · cor · alerta integral
- Sem nova escala de urgência
- Regras `classifyFollowUp` / outcomes / stages intactas

### OUT

| Fora |
|------|
| Mudanças nos Alerts de erro Activity/Stage |
| Novos outcomes |
| Edição do lead |
| Recomputar inteligência |
| Limpar `nextFollowUpAt` |
| Animações / notificações |
| Alterações em Fatia A/B (grid, width, ordem mobile, gaps) |
| Schema / actions / services / automações |
| Modal / dashboard / novo sistema de prioridade |

---

## Guardrails

```text
grid 65/35 · detailWide ~1200px · ordem mobile · gaps Fatia B
score · outcomes · stages · regras de follow-up (domínio)
sem mutação de nextFollowUpAt
touch targets ≥ 44px onde já há CTA
anchors (#register-activity) e teclado funcionam
```

Urgência (hoje/atrasado): **cor + texto + ícone** — sem regressão.

---

## Aceite

| Check | Critério |
|-------|----------|
| Sem `—` ambíguo | Estados tratados usam “Não definido” / empty explícito |
| Sem Intelligence | Fallback compacto; **não** parece erro de carregamento |
| Sem canal | Copy neutra; **sem** ação impossível (editar lead) |
| WON/LOST | Sem urgência residual (alerts hoje/atrasado suprimidos) |
| Anchors / teclado | `#register-activity` e foco/tab OK |
| Desktop / mobile | Sem regressão de layout A/B (`1440×900`, `390×844`) |
| Domínio | Nenhuma mudança schema / action / service |

Smoke sugerido: `scripts/smoke-lead-detail-states-prod.mjs` (IN 1–5 + KEEP overdue/hoje + terminais).

---

## Entrega

```text
Branch exclusiva (ex.: feat/lead-detail-states-fatia-c)
PR sugerido: feat(leads): clarify lead detail empty and terminal states
Sem commit automático — BUILD sob pedido explícito após merge desta decision
```

---

## Ambiguidades — FECHADAS

| # | Decisão |
|---|--------|
| 1 Intelligence empty | **IN** — fallback compacto; MANUAL com linha extra |
| 2 Sem próximo passo | Copy “Não definido” + orientação em stages abertos; âncora opcional |
| 3 Sem canal | Estado neutro; **sem** CTA de edição |
| 4 Terminais | Suppress alerts FU; sem mutar `nextFollowUpAt` |
| 5 Forms error | **OUT** desta fatia |
| 6 Urgência hoje/atrasado | **KEEP** integral |

---

## Regra de DONE

DONE só após merge do BUILD, deploy Production e smoke dos estados IN + KEEP confirmados.
