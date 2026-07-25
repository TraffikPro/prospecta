# Product Grill — Lead Detail States & Urgency v1

- **Data:** 2026-07-24
- **Status:** **GRILL FECHADO** — decision [BUILD REDUCED](product-decision-lead-detail-states-v1.md)
- **Classificação:** WORKSPACE (estados vazios / urgência / terminais — não composição nem densidade)
- **Cadeia:** Lead Detail Redesign v1 → **Fatia C**
- **Predecessor:** [Density v1 DONE](product-decision-lead-detail-density-v1.md) ([#41](https://github.com/TraffikPro/prospecta/pull/41) @ `0f22415`) · [Redesign Fatia A DONE](product-decision-lead-detail-redesign-v1.md)
- **Rota:** `/app/leads/[id]`
- **Produção auditada (código + tip):** `https://prospecta-ten-tau.vercel.app` @ tip pós Density
- **Viewports:** desktop `1440×900` e mobile `390×844`
- **Relacionado:** ADR 0011 (Chakra only), `AppEmptyState`, `LeadNextActionCard`, `ActivityTimeline`

## Product Decision (cadeia)

```text
Lead Detail Redesign v1
    Fatia A — composição          CONGELADA (DONE)
    Fatia B — densidade           CONGELADA (DONE)
    Fatia C — estados e urgência  GRILL FECHADO (este documento)
         → product-decision-lead-detail-states-v1.md
              BUILD REDUCED — explicit empty and terminal states
```

Matriz fechada na decision. BUILD só após merge da decision, em branch exclusiva.

---

## 1. Problema

Com A/B estáveis, o operador ainda encontra buracos de compreensão em **estados vazios**, **terminais** e **urgência residual**:

```text
o que está faltando?
por que não posso agir?
qual é a próxima ação possível?
este estado exige atenção agora?
```

Hoje a urgência `due_today` / `overdue` já usa `Alert` com texto + ícone (não só cor). Os vazios (histórico, contato, inteligência, “sem próximo passo”) e o tratamento de **WON/LOST** frente a follow-up residual são o principal gap.

---

## 2. Hipótese

> Empty states compactos + copy de urgência/terminal claros (cor + texto + ícone) reduzem hesitação sem reabrir grid, densidade ou domínio.

---

## 3. Guardrails (congelados)

```text
grid 65/35
largura detailWide (~1200px)
ordem mobile
padding/gaps aprovados (Fatia B)
score / outcomes / stages
regras de follow-up (classifyFollowUp / getNextAction lógica de domínio)
actions / services / schema
automações
```

**Não adicionar:** modal · dashboard · animações · push · novos componentes de domínio · novo sistema de prioridade.

**Permitido (candidato):** copy, `AppEmptyState compact`, `Alert`/`EmptyState` Chakra existentes, hide/suppress de alert residual em terminais, CTA âncora `#register-activity`, smoke reproduzível.

Urgência deve funcionar em **cor + texto + ícone**.

---

## 4. Inventário de componentes relevantes

| Peça | Situação atual |
|------|----------------|
| `AppEmptyState` (`full` \| `compact`) | Existe; **não** usado no Lead Detail. Pipeline/my-leads já usam. |
| `ActivityTimeline` empty | Texto muted: “Nenhuma atividade registrada.” |
| `LeadContactActions` | “Sem telefone ou e-mail cadastrado.” + CTA “Registrar resultado” |
| Intelligence slot | `null` → **bloco some** (sem empty) |
| `LeadNextActionCard` | Alerts só para `due_today` / `overdue`; Follow-up “—” quando `none` |
| Stage badge WON/LOST | Label + palette |
| `CreateActivityForm` / `MoveStageForm` errors | `Alert` error + `role="alert"` |

---

## 5. Matriz de estados

Formato:

```text
estado
→ comportamento atual
→ problema observado
→ proposta mínima
→ componente Chakra
→ risco
→ critério de aceite
```

Auditoria: código tip Density + comportamento em desktop e `390×844` (mesma árvore; diferença = ordem/scroll, não copy).

### 5.1 Lead sem Activity

| Campo | Conteúdo |
|-------|----------|
| **Estado** | Timeline/histórico vazio (`activities.length === 0`) |
| **Comportamento atual** | Heading “Histórico” + texto muted “Nenhuma atividade registrada.” Sem CTA. Next Action pode já dizer “Fazer primeiro contato”. |
| **Problema observado** | Entende *falta histórico*, mas não amarra *próxima ação* (registrar contato). Empty inconsistente com Pipeline/`AppEmptyState`. |
| **Proposta mínima** | Trocar texto por `AppEmptyState` `compact` + description curta + link/âncora “Registrar atividade” → `#register-activity`. |
| **Componente Chakra** | `AppEmptyState` compact (Text) ou `EmptyState` size sm se quiser título separado — preferir compact para não alongar main. |
| **Risco** | Baixo. Não mexer densidade do rail. Evitar empty “full” alto. |
| **Critério de aceite** | Desktop + mobile: empty explica ausência **e** aponta para `#register-activity`; sem mudança de ordem/grid. |
| **Prioridade grill** | **BUILD candidato** |

### 5.2 Lead sem telefone e sem e-mail

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `phone`/`email` ausentes (ou WA inválido + sem e-mail) |
| **Comportamento atual** | Copy muted “Sem telefone ou e-mail cadastrado.”; botão “Registrar resultado” permanece; header mostra “—”. |
| **Problema observado** | *Can't act* nos canais externos pouco destacado; fácil ler como “ok vazio”. Sem caminho claro para completar contato (origem collapsible). |
| **Proposta mínima** | `Alert` warning subtle sm (texto + ícone): canais ausentes; manter “Registrar resultado”; opcional link “Ver detalhes da origem”. |
| **Componente Chakra** | `Alert` (`status="warning"`) — não só `Text` muted. |
| **Risco** | Médio-baixo: Alert no rail compete com overdue; usar `size="sm"`; **não** aumentar padding Fatia B além do necessário. |
| **Critério de aceite** | Operador vê em &lt;3s que não há canal; CTA registrar permanece; touch ≥44px. |
| **Prioridade grill** | **BUILD candidato** |

### 5.3 Lead sem Intelligence

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `parseLeadIntelligence` falsy → slot `intelligence={null}` |
| **Comportamento atual** | Bloco **desaparece** (sem heading, sem empty). |
| **Problema observado** | Ausência ≠ empty explicado; operador pode achar que “sumiu” ou que a página está incompleta. |
| **Proposta mínima** | Slot sempre presente com `AppEmptyState` compact: “Sem inteligência neste lead” (+ description opcional: score/pitch indisponíveis). |
| **Componente Chakra** | `AppEmptyState` compact. |
| **Risco** | Médio: adiciona altura na **main** (não no rail). Em mobile empurra Activity/Stage — aceitável se compact. Decidir se empty é obrigatório ou só para leads Places sem payload. |
| **Critério de aceite** | Quando não há intel, empty visível e legível; grid/ordem intactos; sem inventar score. |
| **Prioridade grill** | **BUILD candidato (decidir se entra)** — útil, mas pode ser deferido se produto preferir “ausência silenciosa” para manuais. |

### 5.4 Follow-up hoje (`due_today`)

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `classifyFollowUp` → `due_today` |
| **Comportamento atual** | `Alert` warning + Indicator + título “Follow-up hoje”. `actionLabel` pela lógica de outcome. |
| **Problema observado** | Atenção já clara (cor+texto+ícone). Falta às vezes amarrar *o que fazer agora* no próprio alert (fica só no “Ação recomendada”). |
| **Proposta mínima** | Manter Alert; opcional `Alert.Description` com a `actionLabel` ou CTA “Registrar resultado”. **Não** mudar regras de classificação. |
| **Componente Chakra** | `Alert` (já usado). |
| **Risco** | Baixo se só copy; alto se alterar `classifyFollowUp`. |
| **Critério de aceite** | Título distinto de overdue; não color-only; smoke assert texto “hoje”. |
| **Prioridade grill** | **Polish leve / possivelmente FORA** se description for considerada redundante com “Ação recomendada”. |

### 5.5 Follow-up atrasado (`overdue`)

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `followUpState === "overdue"` |
| **Comportamento atual** | `Alert` error + “Follow-up atrasado”; Density: alerta tem prioridade sobre dobra do stage. Smoke prod PASS. |
| **Problema observado** | Já atende urgência. Diferenciação textual vs “hoje” existe. Gap residual: description/CTA opcional. |
| **Proposta mínima** | Preservar integral; polish opcional de description (“Enviar follow-up” / âncora activity). |
| **Componente Chakra** | `Alert` error. |
| **Risco** | Regressão da Fatia B se truncar/esconder alerta. |
| **Critério de aceite** | Texto “atrasado” + ícone; distinct de “hoje”; sem color-only. |
| **Prioridade grill** | **Manter / smoke obrigatório** — não redesenhar. |

### 5.6 Lead sem próximo passo (`followUpState === "none"`, label “—”)

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `nextFollowUpAt` null; Follow-up mostra “—” |
| **Comportamento atual** | Sem Alert. `actionLabel` pode ser “Definir próximo passo” / “Fazer primeiro contato” conforme outcome. |
| **Problema observado** | “—” não comunica *missing next step*; fácil confundir com “sem pendência”. |
| **Proposta mínima** | Substituir “—” por copy explícita (“Sem data”) **e/ou** `Alert` info/warning sm quando outcome exige continuidade e não há FU. **Sem** mudar regras de obrigatoriedade no form. |
| **Componente Chakra** | `Text` enfatizado no campo Follow-up e/ou `Alert` `status="info"`. |
| **Risco** | Médio: Alert extra no rail vs densidade B; preferir copy no campo se couber. |
| **Critério de aceite** | Operador distingue “sem próximo passo” de “agendado no futuro”; próxima ação legível. |
| **Prioridade grill** | **BUILD candidato** |

### 5.7 Lead `WON`

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `stage === "WON"` |
| **Comportamento atual** | Badge “Ganho”; Next Action “Cliente ganho” / “Nenhuma ação comercial pendente”. Forms de activity/stage/contato **ainda ativos**. Se `nextFollowUpAt` residual → alerts hoje/atrasado **ainda podem aparecer**. |
| **Problema observado** | Terminal claro na ação recomendada, mas urgência de FU pode **mentir** após ganho. |
| **Proposta mínima** | Em WON: **não renderizar** alerts `due_today`/`overdue` (só apresentação); opcional `Alert` success sm “Lead ganho — sem ação comercial pendente”. Não desabilitar forms neste grill (evita mudança de regra de produto). |
| **Componente Chakra** | Condicional no `LeadNextActionCard`; opcional `Alert` success. |
| **Risco** | Baixo se só UI; documentar que não altera stage machine. |
| **Critério de aceite** | WON sem alert de FU residual; copy terminal visível desktop + mobile. |
| **Prioridade grill** | **BUILD candidato** (suppress alerts) |

### 5.8 Lead `LOST`

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `stage === "LOST"` |
| **Comportamento atual** | Badge “Perdido”; Next Action “Encerrado” / “Lead perdido — sem próxima ação”. Mesmo risco de alert FU residual. Motivo só no form de move (obrigatório ao marcar). |
| **Problema observado** | Igual WON + motivo não superfícado no detail após LOST. |
| **Proposta mínima** | Suppress alerts FU em LOST; opcional mostrar `lostReason` em Origin/header se já persistido (só se campo já existir na query — **sem** schema novo). |
| **Componente Chakra** | Mesmo padrão WON; `Text`/`Alert` info para motivo se disponível. |
| **Risco** | Não inventar campo; se `lostReason` não vier na page query, só suppress alerts. |
| **Critério de aceite** | LOST sem urgência de FU falsa; copy terminal clara. |
| **Prioridade grill** | **BUILD candidato** (suppress alerts; motivo opcional) |

### 5.9 Erro ao registrar Activity

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `CreateActivityForm` `state.error` |
| **Comportamento atual** | `Alert` error + `role="alert"` + description; toast só no sucesso. |
| **Problema observado** | Já comunica *can't act*. Gap menor: erro não amarra ao field do datetime quando a mensagem é de follow-up obrigatório. |
| **Proposta mínima** | Manter Alert global; opcional `Field.ErrorText` no “Próximo passo” quando a mensagem for essa. |
| **Componente Chakra** | `Alert` (+ `Field.ErrorText` opcional). |
| **Risco** | Baixo. |
| **Critério de aceite** | Erro visível sem depender só de cor; smoke/E2E existentes não quebram. |
| **Prioridade grill** | **Possivelmente FORA** (já suficiente) — polish field-level opcional. |

### 5.10 Erro ao alterar etapa

| Campo | Conteúdo |
|-------|----------|
| **Estado** | `MoveStageForm` `state.error` (ex.: LOST sem motivo) |
| **Comportamento atual** | `Alert` error + description; `lostReason` field aparece ao selecionar LOST. |
| **Problema observado** | Claro o suficiente; erro LOST poderia focar o textarea. |
| **Proposta mínima** | Manter Alert; opcional `Field.ErrorText` em `lostReason`. |
| **Componente Chakra** | `Alert` (+ `Field.ErrorText` opcional). |
| **Risco** | Baixo — não alterar validação/schema. |
| **Critério de aceite** | LOST sem motivo continua bloqueado com mensagem legível. |
| **Prioridade grill** | **Possivelmente FORA** (já suficiente). |

---

## 6. Síntese — o que entra / o que pode ficar de fora

| # | Estado | Recomendação grill |
|---|--------|--------------------|
| 1 | Sem Activity | **ENTRA** — `AppEmptyState` compact + CTA |
| 2 | Sem telefone/e-mail | **ENTRA** — Alert warning canais |
| 3 | Sem Intelligence | **DECIDIR** — empty compact vs ausência silenciosa |
| 4 | Follow-up hoje | **MANTER** (+ polish description opcional) |
| 5 | Follow-up atrasado | **MANTER** + smoke |
| 6 | Sem próximo passo | **ENTRA** — copy explícita (preferir campo Follow-up) |
| 7 | WON | **ENTRA** — suppress alerts FU residual |
| 8 | LOST | **ENTRA** — suppress alerts FU residual |
| 9 | Erro Activity | **FORA ou polish mínimo** |
| 10 | Erro Stage | **FORA ou polish mínimo** |

### BUILD candidato sugerido (para a decision)

```text
IN:
  - Histórico empty → AppEmptyState compact + #register-activity
  - Contato sem canais → Alert warning (texto + ícone)
  - Follow-up “—” → copy “Sem data” / orientação
  - WON/LOST → sem Alert due_today/overdue residual
  - Smoke estados (desktop + 390×844)

DECIDIR NA DECISION:
  - Empty de Intelligence
  - Description extra nos alerts hoje/atrasado
  - Field.ErrorText nos forms

OUT (congelado):
  - grid / width / mobile order / gaps Fatia B
  - domínio, score, outcomes, stages, classifyFollowUp rules
  - modal / dashboard / animações / push / nova prioridade
```

---

## 7. Métrica de aceite (operador)

Em poucos segundos, em desktop e `390×844`:

| Pergunta | Como validar |
|----------|--------------|
| O que falta? | Empty/Alert nomeia a ausência (histórico, canal, data, intel) |
| Por que não age? | Canal ausente / terminal / erro de form explícitos |
| Próxima ação possível? | CTA ou `actionLabel` / âncora activity |
| Atenção agora? | Hoje vs atrasado distintos; terminais sem urgência falsa |

Urgência: **cor + texto + ícone** (já padrão dos Alerts Chakra usados).

---

## 8. Smoke sugerido (pós-BUILD)

Estender ou criar `scripts/smoke-lead-detail-states-prod.mjs` cobrindo:

1. Timeline empty → `AppEmptyState` / CTA
2. Lead sem e-mail/telefone → Alert canais
3. (Se entrar) Intelligence empty
4. `due_today` texto “hoje”
5. `overdue` texto “atrasado”
6. Sem FU → copy ≠ “—” ambíguo
7. WON sem alert overdue/hoje
8. LOST sem alert overdue/hoje
9. Activity error path (opcional)
10. Stage LOST sem motivo → erro

Viewports: `1440×900` e `390×844`.

---

## 9. Ambiguidades para a Decision

| # | Pergunta | Opções |
|---|----------|--------|
| 1 | Empty de Intelligence | Sempre mostrar compact **vs** omitir em leads manuais |
| 2 | Sem próximo passo | Só copy no campo Follow-up **vs** Alert adicional no rail |
| 3 | Contato sem canal | Alert no rail **vs** só reforçar texto atual |
| 4 | Terminais | Só suppress FU alerts **vs** também Affordance de “congelar” outreach (fora se exigir regra de domínio) |
| 5 | Forms error | Manter Alert global **vs** Field.ErrorText |

---

## 10. Próximo passo

```text
GRILL FECHADO
→ product-decision-lead-detail-states-v1.md (BUILD REDUCED)
→ BUILD Fatia C em branch exclusiva
→ smoke estados → DONE
```

Sem commit automático de BUILD.
