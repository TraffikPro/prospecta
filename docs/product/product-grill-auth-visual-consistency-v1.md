# Product Grill — Auth Visual Consistency v1

- **Data:** 2026-07-24
- **Status:** **GRILL** fechado · **Fatia A BUILD autorizada** · Fatia B pendente pós-A
- **Classificação:** WORKSPACE
- **Baseline:** [Login Visual Refresh v1 — DONE](product-decision-login-visual-refresh-v1.md) (PR #28)
- **Relacionado:** [Auth Experience v1](product-decision-auth-experience-v1.md), ADR 0011 (Chakra only), ADR 0012 (reset), ADR 0013 (`mustChangePassword`)

## Product Decision

```text
Login Visual Refresh v1: DONE
    → Auth Visual Consistency v1: GRILL → Fatia A BUILD
         Fatia A — Auth público (forgot + reset) — BUILD autorizado
         Fatia B — Primeiro acesso (change-password) — após merge/deploy/smoke da A
```

---

## 1. Problema

Após o Login Visual Refresh, `/forgot-password`, `/reset-password` e `/change-password` continuam no layout pré-refresh: card centrado genérico, sem marca Prospecta, sem split desktop / top bar mobile. O operador sente descontinuidade na jornada de identidade (entrar → recuperar → redefinir → primeiro acesso).

## 2. Evidência (auditoria produção 2026-07-24)

Base: `https://prospecta-ten-tau.vercel.app` @ tip pós-#28. Viewports `1440×900` e `390×844`.

| Tela | Desktop marca / split | Mobile top bar | Card ~440 | H1 | CTA 1ª dobra | Overflow |
|------|----------------------|----------------|-----------|----|--------------|----------|
| `/login` (baseline) | Sim / ~55% | Sim | 440px | Bem-vindo de volta | Sim | Não |
| `/forgot-password` | Não | Não | `maxW=sm` (~384) | Recuperar acesso | Sim | Não |
| `/reset-password` (sem token) | Não | Não | card estreito | Nova senha | n/a (só alert) | Não |
| `/reset-password?token=…` | Não | Não | `sm` | Nova senha | Sim | Não |
| `/change-password` (anônimo) | — | — | — | redirect → `/login` | — | — |

**Marca:** forgot/reset **não** exibem texto “Prospecta” nem `ProspectaMark`. Login sim.

### Estados por tela

#### `/forgot-password`

| Estado | Comportamento atual | Visual vs login |
|--------|---------------------|-----------------|
| Default | E-mail + Enviar + Voltar ao login | Card só; sem shell |
| Loading | `Enviando…` + Fieldset disabled | OK funcional; layout legado |
| Sucesso | Alert success + ack estável (`forgot-password-ack`) + Voltar | OK copy; sem marca |
| Erro | Alert se validação falhar | Raro (ack genérico no happy path) |

#### `/reset-password`

| Estado | Comportamento atual | Visual vs login |
|--------|---------------------|-----------------|
| Sem `token` | Alert error “Link inválido ou expirado.” + Solicitar novo link | Card legado |
| Token presente (form) | Nova senha + confirmar + Alterar | Card legado |
| Loading | `Alterando…` | OK funcional |
| Sucesso | Alert success + Fazer login | OK funcional |
| Token inválido/expirado (submit) | Mesma mensagem via action | Form permanece no layout legado |

#### `/change-password`

| Estado | Comportamento atual | Visual vs login |
|--------|---------------------|-----------------|
| Gate | Só com sessão + `mustChangePassword` | Card centrado legado (código) |
| Warning | `must-change-password-alert` | Preservar |
| Form | Atual + nova + confirmar + Alterar + **Sair** | Logout crítico |
| Loading / erro | Button loading + Alert error | OK funcional |
| Sucesso | Redirect pós-action (sem tela de sucesso dedicada) | Preservar fluxo |

---

## 3. Hipótese

Se forgot/reset/change-password compartilharem a **linguagem visual** do login (marca, densidade do card, tokens, responsivo) sem alterar contratos de Resend/tokens/sessão/`mustChangePassword`, então a jornada de identidade deixa de parecer “dois produtos” e reduz atrito cognitivo no piloto — sem custo de abstração frágil.

## 4. Comportamento esperado (autorizado)

### Fatia A — Auth público (`/forgot-password`, `/reset-password`) — BUILD

- `PublicAuthShell`: desktop split ~55/45 + mobile top bar + card `440px`.
- Painel desktop **reduzido** (sem `PipelineGraphic`, sem tags):

```text
Prospecta
por DevFlow Labs

Acesse novamente sua operação.
Recupere sua senha e continue de onde parou.
```

- Mobile top bar: `Prospecta · por DevFlow Labs` (uma marca).
- H1 de tarefa preservado (“Recuperar acesso” / “Nova senha”).
- Preservar: ack anti-enumeração, tokens/TTL/uso único, Resend, invalidação de sessões, redirects, autocomplete, `PasswordInput`, mensagens.

**Fora da Fatia A:** change-password, PipelineGraphic, mudanças no Login, server actions, Prisma, theme, Inter, hydration `#18`.

### Fatia B — Primeiro acesso (`/change-password`) — após A

- `TaskAuthShell`: centrado, sem split, sem conteúdo promocional.
- Fluxo: marca compacta → alerta primeiro acesso → formulário → Sair.
- Card `440px`. Nasce só nesta fatia.

### PRs

```text
Fatia A — feat(auth): align password recovery visual experience
Fatia B — feat(auth): align first access visual experience
```

## 5. Comparativo estrutural — atual × Login Refresh

| Dimensão | Login (DONE) | Forgot / Reset (hoje) | Change-password (hoje) | Alvo A / B |
|----------|--------------|------------------------|-------------------------|------------|
| Shell | `AuthShell` + brand login | `Box` + `Card` | Idem legado | `PublicAuthShell` / `TaskAuthShell` |
| Marca | Mark + wordmark | Ausente | Ausente | Presente |
| Desktop | 55/45 + Pipeline | Centrado | Centrado | A: 55/45 reduzido · B: centrado |
| Mobile | Top bar | Sem top bar | Sem top bar | Top bar / marca compacta |
| Card | 440px | `sm` | `sm` | 440px (quatro fluxos) |
| Auth server | Intacto | Intacto | Intacto | Intacto |

## 6. Abstração autorizada

> Consistência ↑ sem API configurável genérica no `AuthShell` do login.

| Peça | Decisão |
|------|---------|
| `ProspectaMark` | Reusar |
| Login `AuthShell` / `AuthBrandPanel` | **Não** adicionar `tone=` |
| `PublicAuthShell` | Nova casca Fatia A; pode reutilizar estrutura interna/padrões do login, painel próprio reduzido |
| `TaskAuthShell` | Nova casca Fatia B apenas |
| Forms | Ajustes visuais leves; actions intactas |

## 7. Classificação

**WORKSPACE** (UI identidade). PLATFORM auth congelado.

## 8. Decisão

- Grill **fechado** com ambiguidades resolvidas (2026-07-24).  
- **Fatia A: BUILD autorizado.**  
- Fatia B: só após merge + deploy + smoke da A.

## 9. Justificativa

Gap visual mensurável; contratos de recovery já cobertos por E2E; duas cascas explícitas evitam over-abstração; PRs separadas limitam regressão.

## 10. Aceite Fatia A

| Check | Critério |
|-------|----------|
| lint / typecheck / test / build | PASS |
| E2E forgot / reset | PASS |
| Desktop 1440×900 | Split + painel reduzido; card 440px |
| Mobile 390×844 | Top bar; 1 marca; CTA 1ª dobra; sem overflow |
| Token ausente / inválido | Mensagens preservadas |
| Sucesso anti-enumeração | Copy estável |

## 11. Ambiguidades — FECHADAS

| # | Decisão |
|---|--------|
| 1 Painel A | Reduzido, sem PipelineGraphic; copy de recuperação |
| 2 Change-password | `TaskAuthShell` centrado, sem split/promo |
| 3 Card | `440px` nos quatro fluxos |
| 4 PRs | Uma por fatia; B depois de A em produção |

## 12. Evidência que mudaria a decisão

- Confusão com o painel mesmo reduzido → enxugar mais o copy do painel A.  
- Necessidade de tocar server actions → REDUCE SCOPE / REJECT da fatia.
