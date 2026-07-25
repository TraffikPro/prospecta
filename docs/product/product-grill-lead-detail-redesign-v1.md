# Product Grill — Lead Detail Redesign v1

- **Data:** 2026-07-24
- **Status:** **GRILL FECHADO** — Fatia A **DONE** em produção; Fatia B exige **novo grill** com densidade real
- **Classificação:** WORKSPACE (UI operacional do detalhe do lead)
- **Fonte Make:** [Figma Make `5KiDxQt6U8TX1vDg3j1Upz`](https://www.figma.com/make/5KiDxQt6U8TX1vDg3j1Upz/Login-screen-example) — protótipo **Detalhe do Lead** (não mais Login)
- **Brief Make:** `file://figma/make/source/5KiDxQt6U8TX1vDg3j1Upz/src/imports/pasted_text/lead-detail-redesign.md`
- **Rota alvo:** `/app/leads/[id]`
- **Produção:** `https://prospecta-ten-tau.vercel.app` @ `866b4f5` ([#37](https://github.com/TraffikPro/prospecta/pull/37))
- **Decisão:** [product-decision-lead-detail-redesign-v1.md](product-decision-lead-detail-redesign-v1.md)
- **Relacionado:** [Lead Next Action](product-decision-lead-next-action.md), ADR 0011 (Chakra only), AppShell / ContextualNav existentes

## Product Decision (cadeia)

```text
Lead Detail atual (single-column handoff)
    → Lead Detail Redesign v1: GRILL FECHADO (este doc)
         → product-decision-lead-detail-redesign-v1.md
              Fatia A — DONE (#37 @ 866b4f5)
              Fatia B — PLANNED (novo grill com densidade prod)
              Fatia C — PLANNED
```

---

## 1. Problema

O detalhe do lead é a tela de **execução** do operador (abrir lead → entender → contatar → registrar → avançar etapa). Hoje a página é **uma coluna** (`PageFrame width="detail"`, max ~60rem) com stack longo: inteligência e notas ficam **antes** do form; mudança de etapa fica **depois** do histórico. No mobile, só o botão “Salvar atividade” é sticky — next action e contato somem no scroll.

O Make redesenha a composição (grid desktop ~65/35, ordem mobile operacional, painel lateral de handoff) **sem** pedir novos campos, automações ou redesenho do AppShell. O gap é de **layout e hierarquia**, não de domínio.

---

## 2. Evidência

### 2.1 Make (protótipo + brief)

Viewports de referência: desktop **1440×900**, mobile **390×844**.

**Desktop (~65 / 35) — composição alvo após decisões:**

| Coluna | Conteúdo |
|--------|----------|
| Principal (~65%) | Resumo/Intel → Registrar atividade → Histórico → Detalhes da origem (Collapsible) |
| Rail operacional (~35%) | Próxima ação → Contato → Alterar etapa |

**Mobile (ordem fechada):** ver §5.2.

**Estados demo no Make:** `new` · `followup_today` · `overdue` · `with_history`.

**Shell:** AppShell / breadcrumbs / bottom nav mobile **preservados**.

**Fora do Make (explícito):** dashboard, automação WhatsApp/e-mail, CRUD de activities, score/ACL novos, Kanban, dark mode, IA nova / campos inventados.

### 2.2 Prospecta atual (código @ `main`)

**Entrada:** `src/app/(authenticated)/app/leads/[id]/page.tsx`

**Layout:** single-column vertical; sem grid de página; sem painel lateral.

| Ordem | Bloco | Componente |
|------:|-------|------------|
| 1 | Nav contextual | `ContextualNav` |
| 2 | Ficha / header | `LeadInfoCard` |
| 3 | Próxima ação | `LeadNextActionCard` |
| 4 | Contato | `LeadContactActions` |
| 5 | Inteligência (se parseável) | `IntelligenceCard` |
| 6 | Notas (se `lead.notes`) | inline `Stack` + `Text` |
| 7 | Registrar atividade | `CreateActivityForm` (`#register-activity`) |
| 8 | Histórico | `ActivityTimeline` |
| 9 | Mudar etapa | `MoveStageForm` |

**Sticky:** apenas submit “Salvar atividade” em `base` (`CreateActivityForm`). Nada de next action / contact sticky.

**Loading:** `loading.tsx` → `PageSkeleton width="detail"`. Sem `error.tsx` / `not-found.tsx` locais na rota.

**Campos já na UI:** empresa, stage, source, contato, owner, email, phone, website, next follow-up, next-action derivado, WhatsApp/mailto, score/signals/diagnostic/pitch (se intelligence), notes, form de atividade (type/outcome/body/follow-up), timeline, move stage (+ `lostReason` se LOST).

**Parseado mas não renderizado no detail:** `campaign` (intelligence). Schema presente mas fora da página: `title`, leitura de `lostReason`/`wonNote`, `createdAt`/`updatedAt`, etc.  
**Nenhum dado existente será removido nesta v1** — só reorganização / compactação de header.

---

## 3. Hipótese

Se reorganizarmos o Lead Detail em **composição operacional** (desktop: coluna principal + rail sticky só do grupo operacional; mobile: handoff-first) **reusando os mesmos blocos e contratos**, o operador vê Activity mais cedo no desktop, ações comerciais na primeira dobra, e mobile sem regressão — sem expandir domínio.

---

## 4. Comparativo estrutural — atual × alvo (decisões fechadas)

| Dimensão | Atual | Alvo (fechado) |
|----------|-------|----------------|
| Largura | `detail` ~60rem (~960px) | Variante **local** ~**1200px** só no Lead Detail |
| Grid desktop | 1 coluna | ~65% main / ~35% rail |
| Sticky | Só CTA salvar (mobile form) | Rail operacional sticky **só desktop** (com regras §5.3) |
| Header | `LeadInfoCard` denso (DataList) | **Compacto** — nome, etapa, origem, responsável, telefone/e-mail |
| Intelligence / campanha no header | Misturado na ficha | **Fora do header** |
| Ordem desktop main | … Notes no meio … Stage no fim | Intel/resumo → Form → History → **Detalhes da origem** |
| Ordem desktop rail | n/a | Next → Contact → **Move stage** |
| Notas | Seção aberta no meio | `Collapsible` **Detalhes da origem** no fim da main |
| Pitch | Toggle local (comportamento atual) | **Colapsado por padrão** + Ver / Copiar (a11y teclado) |
| AppShell / nav | Preservar | Preservar |
| Activity / stage rules | Intactas | Intactas (só reposicionamento do form de etapa) |
| Novos campos / automação | — | **Fora** |

---

## 5. Composição alvo (decisões fechadas)

### 5.1 Header compacto

Manter no cabeçalho:

- nome (empresa);
- etapa;
- origem;
- responsável;
- telefone / e-mail principais.

**Não entram no header:** informações técnicas de campanha e inteligência.

### 5.2 Desktop (~65 / 35)

**Coluna principal:**

```text
Lead header (compacto, full-width acima do grid ou span)
→ Resumo / Inteligência
→ Registrar atividade
→ Histórico
→ Detalhes da origem (Collapsible; notes + contexto técnico que sair do header)
```

**Rail operacional (sticky — ver §5.3):**

```text
Próxima ação
Contato
Alterar etapa
```

`Detalhes da origem` **nunca** no sticky.

### 5.3 Sticky rail (desktop only)

Somente o grupo operacional é sticky:

```text
Próxima ação
Contato
Alterar etapa
```

Regras:

- sticky **apenas em desktop**;
- offset abaixo do header do app;
- **sem** scroll interno no rail;
- se a altura do grupo ultrapassar a viewport → **deixar de ser sticky** (fluxo normal de documento).

Sem sticky rail no mobile.

### 5.4 Ordem mobile (fechada)

```text
Retorno / breadcrumb
Lead header
Próxima ação
Contato
Resumo
Inteligência
Registrar atividade
Histórico
Alterar etapa
Detalhes da origem
```

### 5.5 Pitch (Fatia A: comportamento mínimo; densificação visual em B)

- **Colapsado por padrão.**
- Mostrar: título · breve indicação do conteúdo · “Ver abordagem” · “Copiar abordagem”.
- Estado expandido permanece disponível e acessível por teclado.

Na Fatia A: garantir colapso default + CTAs sem redesenhar o bloco Intelligence por completo. Polish visual do pitch pode completar em B se necessário.

### 5.6 Stage

- Move para o **rail** (desktop) e posição na ordem mobile (§5.4).
- Action, validações, `lostReason`, toast e testes **intactos** — só reposicionamento.

### 5.7 Largura

- Abrir **somente** Lead Detail para ~`max-width: 1200px`.
- **Não** alterar globalmente todos os `PageFrame detail`.
- Usar variante explícita (ex.: `detailWide`) **ou** configuração local da rota.

---

## 6. Fatias

```text
Fatia A — LAYOUT PURO (não juntar com B)
         grid desktop 65/35
         → ordem mobile
         → rail operacional (+ sticky rules)
         → reposicionamento dos blocos
         → header compacto (campos do §5.1)
         → notes → Detalhes da origem (Collapsible)
         → pitch colapsado por padrão (mínimo)
         Sem redesenhar internamente Intelligence, form, Timeline ou badges

Fatia B — PLANNED — densidade visual dos blocos alinhada ao Make

Fatia C — PLANNED — empty / urgency polish + smoke visual (após A+B estáveis)
```

PRs sugeridos:

```text
Fatia A — feat(leads): lead detail dual-column operational layout
Fatia B — feat(leads): densify lead detail handoff blocks
Fatia C — feat(leads): lead detail empty and urgency visual polish
```

### Métricas de sucesso — Fatia A

- Activity visível mais cedo no desktop;
- ações comerciais (próxima ação / contato / etapa) na primeira dobra útil;
- mobile sem regressão (ordem §5.4; sem sticky rail);
- nenhuma mudança de domínio;
- nenhum campo ou comportamento perdido.

---

## 7. Abstração autorizada

| Peça | Decisão |
|------|---------|
| `PageFrame` | Variante explícita ~1200px **só** Lead Detail; não mudar `detail` global |
| `LeadDetailLayout` (ou equivalente) | OK se só orquestra grid / ordem / sticky |
| Blocos existentes | Reposicionar; Fatia A sem redesign interno de Intel/form/timeline/badges |
| Header | Compactar conteúdo exibido; dados técnicos → Detalhes da origem |
| `MoveStageForm` | Reposicionar; action intacta |
| Pitch / `PitchBox` | Default colapsado + Ver / Copiar; a11y teclado |
| `tone=` genérico em cards | Evitar |
| Server actions / Prisma / schemas | **Congelados** |

---

## 8. Classificação

**WORKSPACE** — UI de detalhe operacional.  
PLATFORM / auth / activity business rules **fora**.

---

## 9. Decisão

- Grill **fechado** com ambiguidades resolvidas (2026-07-24).
- **BUILD da Fatia A** fica autorizado **somente** após:
  1. merge deste grill;
  2. publicação de `product-decision-lead-detail-redesign-v1.md` (Fatia A — BUILD; B/C — PLANNED);
  3. pedido explícito de BUILD da Fatia A.
- Fatias B e C permanecem PLANNED até decisão própria.

---

## 10. Justificativa

- Dor mensurável: scroll longo até form; handoff some; stage no fim.
- Make + decisões fecham composição sem expandir domínio.
- Sticky só no grupo operacional evita rail alto com notes/origem técnica.
- Fatia A pura valida layout antes de densificar cards (menor blast radius).

---

## 11. Aceite Fatia A (quando BUILD)

| Check | Critério |
|-------|----------|
| lint / typecheck / test / build | PASS |
| E2E activity + stage (existentes) | PASS — regras / `lostReason` / toasts intactos |
| Desktop 1440×900 | Grid ~65/35; rail = Next + Contact + Stage; Activity mais cedo na main |
| Desktop sticky | Só grupo operacional; offset header; sem scroll interno; desliga se altura > viewport |
| Mobile 390×844 | Ordem §5.4; sem sticky rail; sem overflow horizontal |
| Header | Compacto (§5.1); campanha/intel fora do header |
| Detalhes da origem | Collapsible no fim da main; notes preservadas |
| Pitch | Colapsado por default; Ver + Copiar; expand acessível por teclado |
| Largura | ~1200px só no detail; outras rotas `detail` intactas |
| Domínio | Nenhum campo/comportamento perdido; sem schema/action nova |
| AppShell / ContextualNav / bottom nav | Intactos |

Smoke sugerido: Fatia C (ou A se útil) — `scripts/smoke-lead-detail-visual-prod.mjs`.

---

## 12. Ambiguidades — FECHADAS

| # | Decisão |
|---|--------|
| 1 Header | **Compacto** — nome, etapa, origem, responsável, telefone/e-mail. Campanha/intel fora do header |
| 2 Notas | **Detalhes da origem** (`Collapsible`) no fim da coluna principal, após Histórico. Não no sticky. Nenhum dado removido |
| 3 Largura | ~**1200px** só no Lead Detail via variante/config local; não mudar `detail` global |
| 4 Stage | Rail operacional; action/validações/`lostReason`/toast/testes intactos |
| 5 Pitch | **Colapsado por padrão**; título + indicação + Ver + Copiar; expand por teclado |
| 6 Fatias | **A pura** — não juntar A+B. A = grid + ordem mobile + rail + reposicionamento |
| Sticky | Só Next + Contact + Stage; desktop only; offset header; sem scroll interno; unstick se altura > viewport |
| Mobile order | Breadcrumb → header → Next → Contact → Resumo → Intel → Form → History → Stage → Detalhes da origem |

---

## 13. Evidência que mudaria a decisão

- Operadores pedirem edição inline / reassign / novos campos → **novo grill** de domínio.
- Regressão em regras de activity/stage → REDUCE SCOPE da fatia visual.
- Rail operacional frequentemente mais alto que a viewport → revisar sticky (já há fallback unstick).

---

## 14. Fora de escopo (explícito)

- Redesign AppShell / lista de leads / My Queue / Inbox
- Automações WhatsApp/e-mail, templates, VoIP
- CRUD completo de activities, anexos, threads
- Score/ACL novos; inventar campaign UI
- Kanban, dashboard no detail, dark mode
- Inter global / theme tokens fora do brand atual
- Qualquer mudança server-side de auth
- Fatia A: redesign interno de Intelligence, formulário, Timeline ou badges

---

## 15. Checklist

- [x] Ordem e composição atuais mapeadas (`page.tsx`)
- [x] Make + brief lidos (Detalhe do Lead, não Login)
- [x] Contratos a preservar listados
- [x] Ambiguidades §12 fechadas com o produto (2026-07-24)
- [x] Merge PR docs deste grill (#35)
- [x] `product-decision-lead-detail-redesign-v1.md` (#36)
- [x] BUILD Fatia A (#37) + deploy Production + smoke OVERALL PASS
- [ ] Novo grill Fatia B com densidade real em produção
