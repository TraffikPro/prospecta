# Product Grill — Lead Detail Density v1

- **Data:** 2026-07-24
- **Status:** **GRILL FECHADO** — decision [BUILD REDUCED](product-decision-lead-detail-density-v1.md)
- **Classificação:** WORKSPACE (densidade / hierarquia interna — não composição)
- **Predecessor:** [Lead Detail Redesign v1 — Fatia A DONE](product-decision-lead-detail-redesign-v1.md) ([#37](https://github.com/TraffikPro/prospecta/pull/37) @ `866b4f5`)
- **Cadeia Fatia B:** densidade e hierarquia interna dos blocos do detail
- **Produção medida:** `https://prospecta-ten-tau.vercel.app` (pós Fatia A)
- **Evidência:** `docs/product/assets/lead-detail-density-v1/` + `measurements.json`
- **Script:** `scripts/measure-lead-detail-density-prod.mjs`
- **Relacionado:** [product-grill-lead-detail-redesign-v1.md](product-grill-lead-detail-redesign-v1.md), ADR 0011

## Product Decision (cadeia)

```text
Lead Detail Redesign v1
    Fatia A — DONE (composição 65/35 + ordem mobile)
    → Lead Detail Density v1: GRILL FECHADO (este doc)
         → product-decision-lead-detail-density-v1.md
              BUILD REDUCED — rail density only
```

---

## 1. Problema

A Fatia A reposicionou o rail operacional, mas **não densificou** os blocos. Em produção (desktop 1440×900), **Next Action** e **Contato** entram na primeira dobra; **Alterar etapa** começa ~12px abaixo do fold (`y≈912` com viewport `h=900`). O operador ainda precisa de um pequeno scroll para mudar etapa — gap de densidade, não de composição.

Este grill ataca **só** espaços, tipografia e hierarquia interna. A composição aprovada permanece congelada.

---

## 2. Hipótese

> Reduzir espaços e textos redundantes no rail coloca a mudança de etapa mais próxima da primeira dobra sem prejudicar leitura ou acessibilidade.

---

## 3. Guardrails (congelados)

```text
grid 65/35 permanece
ordem mobile permanece
sem modal/drawer
sem mudar domínio
sem esconder campos necessários
sem transformar rail em dashboard
```

Adicionalmente:

- Sem schema / action / service
- Touch targets ≥ 44px onde já existem CTAs
- Clipboard, toasts, `#register-activity`, breadcrumbs intactos
- Sticky rules da Fatia A intactas (desktop only; unstick se não couber)

---

## 4. Evidência — medidas produção (2026-07-25)

Fonte: `measurements.json` gerado contra produção. Viewports: **1440×900** e **390×844**. Leads manuais sem intelligence (rail independente da coluna de intel).

### 4.1 Desktop 1440×900 — lead sem Activity

| Bloco | Altura (px) | Top `y` | Bottom | 1ª dobra? |
|-------|------------:|--------:|-------:|:---------:|
| Header compacto (`LeadInfoCard`) | **136** | 294 | 430 | sim |
| Próxima ação | **251** | 463 | 714 | sim |
| Contato | **133** | 746 | 879 | sim (folga ~21px) |
| Alterar etapa (card) | **218** | 912 | 1130 | **não** |
| Registrar atividade | 554 | 463 | 1017 | parcial |
| Detalhes da origem (collapsed) | 44 | 1163 | 1207 | não |

- `data-sticky=true`
- Rail empilhado ≈ **650px** (next + contact + stage + gaps)
- Next text ≈ 105 chars · Contact text ≈ 35 chars · Header list ≈ 109 chars
- Screenshot: `desktop-1440x900-no-activity.png`

**Leitura:** faltam ~**230px** de compressão no stack do rail (ou no header acima) para o topo do stage (`y=912`) entrar em `y≤900` com folga mínima; para o **card inteiro** do stage caber na dobra (`bottom≤900`), a meta é mais agressiva (~230px + altura residual do card acima do fold).

Meta prática Fatia B (desktop):

1. **Mínima:** topo do stage na 1ª dobra (`stage.y < 900`)
2. **Ideal:** card de stage com CTA “Salvar etapa” visível sem scroll (`stage.bottom ≤ 900`)

### 4.2 Desktop 1440×900 — lead com histórico (1 NOTE)

| Bloco | Altura | Top `y` | 1ª dobra? |
|-------|-------:|--------:|:---------:|
| Header | 136 | 288 | sim |
| Próxima ação | 251 | 457 | sim |
| Contato | 133 | 748 | sim |
| Alterar etapa | 218 | 921 | **não** |
| Histórico (timeline) | 69 | 1079 | não |

- Rail **não muda** de altura com histórico (esperado: histórico na main).
- Timeline curta (1 item) não compete com o rail; históricos longos só alongam a main.
- Screenshot: `desktop-1440x900-with-history.png`

### 4.3 Mobile 390×844 — lead sem Activity

| Bloco | Altura | Top `y` | 1ª dobra? |
|-------|-------:|--------:|:---------:|
| Header | **188** | 246 | sim |
| Próxima ação | 251 | 459 | sim |
| Contato | 133 | 734 | **não** (bottom 867 > 844) |
| Activity | 571 | 891 | não |
| Stage | 218 | 1568 | não |

- `data-sticky=false` (correto)
- Ordem operacional preservada
- Screenshot: `mobile-390x844-no-activity.png`

**Leitura mobile:** Contato quase na dobra; stage continua longe (após activity). Densidade no rail/header ainda ajuda o scroll total, mas a meta “stage na 1ª dobra” é **desktop-first**; mobile não deve forçar compressão que quebre touch targets.

---

## 5. Avaliação por dimensão

### 5.1 Altura real de Next Action — **251px**

Conteúdo atual:

- H2 “Próxima ação”
- 3 pares label + valor (Status / Ação / Follow-up) com `Stack gap="4"`
- Espaço vazio inferior perceptível quando não há alerta

Alavancas (sem esconder campos):

- Reduzir `gap` do card (4 → 2/3)
- Tipografia mais compacta (H2 `md` → `sm`; labels já `xs`)
- Layout em grid 2 colunas para status/follow-up quando não há alerta
- Alertas `due_today` / `overdue` podem crescer o card — aceitar stage fora da dobra nesses estados (ou densificar alerta)

### 5.2 Texto / UI do bloco Contato — **133px**, ~35 chars

Conteúdo atual:

- Título “Contato”
- Botão(ões) Contatar / E-mail (`minH="11"`)
- CTA “Registrar resultado” full outline

Alavancas:

- Remover título redundante se o contexto do rail já for claro **ou** torná-lo visualmente secundário
- Empilhar menos: HStack Contatar + Registrar na mesma linha quando couber no rail (~0.9fr)
- Manter `minH` touch — compressão via layout, não via target &lt; 44px

### 5.3 Densidade do formulário de etapa — **218px**

Conteúdo atual:

- Card + `SectionHeading` “Alterar etapa”
- NativeSelect + botão “Salvar etapa”
- `lostReason` textarea só se LOST (estado expandido — medir à parte)

Alavancas:

- Reduzir gaps internos do form (`gap="4"` → `2`/`3`)
- Heading mais compacto
- Evitar `maxW="md"` desperdiçando largura do rail (opcional visual)
- **Não** esconder `lostReason` quando LOST

### 5.4 Espaço vertical do header compacto — **136px** desktop / **188px** mobile

Ainda há DataList com 3 itens + padding de Card Header/Body. Em mobile o empilhamento de badges aumenta altura.

Alavancas:

- Menos padding no Card
- DataList mais densa (gap 4 → 2)
- Owner em uma linha truncada
- **Não** remover nome / etapa / origem / owner / tel / e-mail

Impacto: cada 20–40px economizados no header sobem o rail inteiro na dobra.

### 5.5 Stage na primeira dobra — viabilidade

| Meta | Δ necessário (aprox.) | Viável sem esconder campos? |
|------|----------------------:|----------------------------|
| Topo do stage na dobra | ~15–40px | Sim (ajustes leves header + gaps) |
| Card stage + CTA na dobra | ~230px+ | Sim se next+contact+stage forem densificados juntos (~35% next + 20% contact + 20% stage + header) |
| Stage na dobra **com** alerta overdue no Next | maior | Talvez só meta “topo”; full card pode falhar — documentar exceção |

### 5.6 Legibilidade vs compressão

Riscos a evitar:

- Labels sumindo (só ícones) no Contato
- Select/etapa com altura &lt; touch
- Contraste/alertas comprimidos demais
- Pitch / Intelligence densificados a ponto de parecer “dashboard”

Princípio: **comprimir whitespace e headings redundantes**; preservar copy operacional e targets.

### 5.7 Sem Activity vs com histórico

| Dimensão | Sem Activity | Com histórico (1 item) |
|----------|--------------|------------------------|
| Alturas do rail | next 251 / contact 133 / stage 218 | **iguais** |
| Main | só Activity form | Activity + Timeline (~69px extra) |
| Stage na dobra | não | não |
| Sticky | true | true |

Conclusão: histórico **não** é a causa do stage fora da dobra. Foco da Fatia B = **rail + header**, não timeline.

*(Leads com Intelligence alta alongam a main; rail permanece o gargalo da dobra operacional.)*

---

## 6. Escopo proposto (quando BUILD)

### Dentro

1. Densificar `LeadNextActionCard` (gaps, heading, opcional grid interno)
2. Densificar `LeadContactActions` (layout; sem remover CTAs)
3. Densificar `MoveStageForm` (gaps/heading; LOST intacto)
4. Densificar `LeadInfoCard` compacto (padding/DataList)
5. Revalidar métricas desktop 1440×900 (stage topo / ideal CTA na dobra)
6. Regressão mobile: ordem, overflow, touch, sticky=false
7. Atualizar smoke de densidade (extensão do smoke Fatia A ou script dedicado)

### Fora

- Qualquer mudança de grid/ordem (Fatia A congelada)
- Modal / drawer / tabs novas
- Domínio, schemas, actions, services
- Esconder campos necessários
- Transformar rail em dashboard (stats, score, múltiplos widgets novos)
- Fatia C (urgência polish / empty ilustrados) — só o necessário para não regressar alertas existentes

---

## 7. Escopo fechado — BUILD REDUCED (rail only)

```text
Entra: Next Action · Contato · Alterar etapa · gaps do rail
Fora:  header · Intelligence · Activity · Timeline · Origin · grid · ordem mobile
```

---

## 8. Aceite (alinhado à decision)

| Check | Critério |
|-------|----------|
| Composição | Grid 65/35 e ordem mobile **inalterados** |
| Desktop 1440×900, estado normal | Título “Alterar etapa” + select na 1ª dobra |
| CTA Salvar etapa | Pode ficar abaixo; scroll curto ok |
| Overdue | Alerta integral; stage pode descer |
| Sticky | Unstick; seleção de stage preservada |
| Mobile 390×844 | Sem overflow; targets ≥ 44px; sticky=false; ordem intacta |
| Domínio | Sem schema/action/service |

---

## 9. Ambiguidades — FECHADAS

| # | Decisão |
|---|--------|
| 1 Meta dobra | Heading + select na dobra; CTA Salvar pode ficar abaixo |
| 2 Contato | Título visível e compacto; sem sr-only; targets ≥ 44px |
| 3 Overdue | Exceção — urgência > meta de dobra; não truncar alerta |
| 4 Escopo PR | **Somente rail** |
| 5 Activity | Fora |

---

## 10. Decisão

- Grill **fechado** com ambiguidades resolvidas (2026-07-24).
- Decision: [product-decision-lead-detail-density-v1.md](product-decision-lead-detail-density-v1.md) — **BUILD REDUCED**.
- BUILD só após merge da decision + pedido explícito.

---

## 11. Justificativa

- Gap mensurável: stage a ~12px do fold; rail ~650px vs viewport útil após chrome/header.
- Composição já validada (Fatia A); risco isolado em densidade.
- Sem Activity vs com histórico prova que o rail é o gargalo.
- Hipótese testável com re-medida do mesmo script em produção.

---

## 12. Checklist

- [x] Screenshots produção desktop/mobile
- [x] Medidas de altura Next / Contato / Stage / Header
- [x] Comparativo sem Activity vs com histórico
- [x] Guardrails de composição documentados
- [x] Ambiguidades §9 fechadas (2026-07-24)
- [x] `product-decision-lead-detail-density-v1.md` (BUILD REDUCED)
- [ ] BUILD rail density executado + smoke
