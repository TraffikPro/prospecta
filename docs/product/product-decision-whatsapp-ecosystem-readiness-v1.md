# Product Decision — WhatsApp Ecosystem Readiness v1

- **Data:** 2026-08-18
- **Decisão:** **BUILD** (escopo reduzido após re-grill) — fundação com cancela fechada
- **Classificação:** PLATFORM (contrato, APIs internas, flags, staging) · WORKSPACE (elegibilidade no lead) · PILOT_SPECIFIC (templates/oferta do piloto)
- **Não autoriza:** go-live, disparo real, lote automático, cadência D0/D+2/D+5/D+9 via API, WhatsApp Business API em produção, substituir `wa.me`
- **Contrato:** [whatsapp-ecosystem-contract-v1.md](whatsapp-ecosystem-contract-v1.md)
- **ADR:** [0015](../adr/0015-whatsapp-ecosystem-readiness.md)
- **Operação / rollback:** [whatsapp-operations-runbook.md](whatsapp-operations-runbook.md)

## Product Decision (re-grill)

Proposta original (ecossistema completo + envio): **REDUCE SCOPE**.  
Proposta cortada (estrada pronta, cancela fechada): **BUILD**.

```text
BUILD — WhatsApp Ecosystem Readiness v1

A — Consentimento e elegibilidade
B — Identidade e contrato entre sistemas
C — Template oficial (catálogo; envio só em staging + flag)
D — Sincronização de eventos (idempotente; origem técnica)
E — Staging, flags e runbook

Go-live e cadência automática: DEFER
Disparo em massa: REJECT
```

### 1. Problema

Ligar envio oficial (Meta / DevFlow) sem consentimento, telefone E.164, vínculo único lead↔thread, APIs assinadas e staging vira improvisação em produção: risco LGPD, política da Meta, Activities duplicadas e pipeline alterado por texto de mensagem.

O workaround atual (`wa.me` + Activity humana) **funciona** para o Sprint 0. O problema deste BUILD não é “falta de conversa”; é **não ter como ligar a API depois sem reescrever o produto em pânico**.

### 2. Evidência

| Tipo | Conteúdo |
| --- | --- |
| Fato | V1 envia via `wa.me`; ADR 0001 / MVP: sem API de envio |
| Fato | Mapa de telas: WhatsApp API = **NOT YET** (envio) |
| Fato | Sprint 0: lote Santos, 0 Activities confirmadas; processo manual permanece |
| Fato | `Lead.phone` não é E.164; Activity exige `authorId` de `User` humano |
| Fato | Ingestão máquina atual é Bearer (`PROSPECTA_IMPORT_TOKEN`), sem HMAC/replay |
| Fato | Prospecta V1 é **single-tenant**; DevFlow é sistema externo |
| Hipótese | Contrato + elegibilidade + flags evitam go-live inseguro |
| Incerteza | Capacidades atuais da DevFlow neste workspace; número de teste Meta; formato final do ator técnico |

Não há evidência comercial de que a API aumenta reunião. Há evidência de que **envio sem opt-in** é inválido (Meta + LGPD).

### 3. Hipótese

Se o time modelar consentimento, identidade, templates oficiais e eventos idempotentes **com flags desligadas em produção**, então o go-live vira ativação controlada em staging — não um atalho em produção — sem alterar o processo manual do Sprint 0.

### 4. Comportamento esperado (até o go-live)

```text
Lead Generator
→ Prospecta valida elegibilidade e organiza o trabalho
→ DevFlow gerencia a conversa no WhatsApp
→ eventos retornam ao Prospecta
→ operador classifica resultado e próximo passo
```

Até o go-live:

- nenhum disparo real;
- nenhum lote automático;
- nenhuma cadência D0/D2/D5/D9 **pela API**;
- testes somente com números autorizados;
- produção com feature flags `false`.

`wa.me` permanece o canal do piloto. Telefone disponível ≠ contato autorizado.

### 5. Métrica

Não inventar KPI de conversão para esta fatia. Observáveis de **prontidão**:

| Métrica | Como observar |
| --- | --- |
| Flags em produção = `false` | env / Vercel |
| `UNKNOWN` / `OPTED_OUT` bloqueiam envio na API | testes de contrato |
| Evento repetido não duplica Activity | teste de idempotência |
| Staging E2E verde com números allowlist | suíte staging |
| Sprint 0 continua no `wa.me` | Activities humanas no lote Santos |

### 6. Menor implementação (autorizada)

**Este corte (PR 1):** contrato versionado + esta decisão + ADR + runbook. Sem schema, sem rota, sem UI.

PRs seguintes: ver [sequência](#divisão-em-prs). Cada uma atrás das flags. Sem ativar produção.

### 7. Classificação

**PLATFORM** (segurança da integração) + **WORKSPACE** (elegibilidade no lead). Templates de copy são **PILOT_SPECIFIC**.

Prospecta **não** vira multi-tenant SaaS. `tenantId` no contrato é o tenant da **DevFlow** (env), não um modelo `Tenant` no CRM.

### 8. Decisão

**BUILD** (reduzido). Go-live / cadência API = **DEFER**. Disparo em massa = **REJECT**.

### 9. Justificativa

A proposta completa era infraestrutura de envio antes de evidência comercial (e contradizia o freeze). O corte mantém o valor de **segurança e rastreabilidade** e remove o que o piloto não pode ligar: disparo, cadência automática, massa.

REDUCE SCOPE não é BUILD implícito: o grill foi refeito sobre o corte. O que entra é só readiness.

### 10. Artefato da decisão

Escopo A–E abaixo. Contrato em [whatsapp-ecosystem-contract-v1.md](whatsapp-ecosystem-contract-v1.md).

### 11. Responsável

| Área | Owner |
| --- | --- |
| Contrato / flags / APIs Prospecta | Gustavo (Produto e Tecnologia) |
| Inbox / templates / webhook Meta | Owner DevFlow |
| Consentimento operacional / números de teste | Sócio Comercial + Operações |
| Validação Sprint 0 (`wa.me`) | Sócio Comercial |

### 12. Prazo

Readiness “pronto para ligar” = suíte de staging passando + checklist do runbook.  
Go-live = **novo grill**, só depois da homologação (e sem atropelar o Sprint 0).

### 13. Evidência que mudaria a decisão

- Staging não existe / Meta test number indisponível → parar nas fatias A–B (elegibilidade + contrato), não fingir envio.
- Operadores passam a usar a API em produção com flag off → incidente; rollback no runbook.
- Sprint 0 exigir mudança de score/pitch → este BUILD **não** autoriza isso.

---

## Relação com o Sprint 0 e o mapa de telas

Trilhas **paralelas**:

| Trilha | Estado |
| --- | --- |
| Sprint 0 — evidência comercial | **VALIDATE** — `wa.me` + Activity humana; score/pesos/pitch congelados |
| WhatsApp API envio / cadência | **NOT YET** / **DEFER** |
| Este BUILD | Fundação + flags `false`; seção futura no **mesmo** Lead Detail; **sem rota nova** |

Não substitui o freeze: não há tela nova, não há hub, não há dashboard de conversão, não há entidade Campaign.

Telefone vindo do Google Places **não** implica `OPTED_IN`.

---

## Escopo autorizado (A–E)

### A — Consentimento e elegibilidade

Fatia: `WhatsApp Contact Eligibility Foundation v1`.

No Lead ou entidade própria:

- telefone normalizado E.164 (além do `phone` atual usado no `wa.me`);
- `consent.status`: `UNKNOWN` \| `OPTED_IN` \| `OPTED_OUT`;
- origem, finalidade, `grantedAt`, `optedOutAt`;
- referência da thread DevFlow;
- estado da integração.

UI no Lead Detail (fatia posterior, **não** nesta PR de docs):

```text
WhatsApp

Telefone: +55...
Elegibilidade: Não verificada
Conversa: Não vinculada

[Registrar autorização]
[Registrar recusa]
```

Regras:

- `UNKNOWN`: API não envia;
- `OPTED_IN`: permite vincular/iniciar conforme template;
- `OPTED_OUT`: bloqueia qualquer envio;
- inbound iniciado pelo lead pode registrar permissão/origem;
- toda mudança gera auditoria.

Não remover o botão manual `wa.me`. Deixar explícito: telefone disponível ≠ autorizado.

### B — Identidade e contrato

Ver contrato v1. DevFlow: `WaInboxThread` ↔ `prospectaLeadId` (unique). Associação por telefone exige confirmação. Sem copiar score/pipeline para a DevFlow.

### C — Template oficial

DevFlow evolui `sendText` → `sendTemplate`. Só templates aprovados no Meta Business Manager. Sem template disfarçado de mensagem pessoal para prospecção sem consentimento.

Catálogo mínimo (quando a Meta aprovar — **não** inventar copy aqui):

1. autorização já obtida — apresentação;
2. entrega de demonstração solicitada;
3. confirmação de reunião;
4. follow-up solicitado pelo contato.

Persistir nome, idioma, versão, variáveis, snapshot, consentimento que autorizou, categoria, ID Meta.

### D — Eventos

DevFlow recebe webhook Meta e publica evento interno no Prospecta (`POST /api/internal/whatsapp/events`). Idempotência por `eventId`.

Não atualizar automaticamente `INTERESTED`, `WON` ou `LOST` a partir do texto. Outcome comercial continua humano.

Activities automáticas: origem técnica (`WHATSAPP_PLATFORM` ou equivalente). Não atribuir ao operador.

### E — Staging e runbook

Flags (default / produção = `false`):

```text
WHATSAPP_INTEGRATION_ENABLED=false
WHATSAPP_TEMPLATE_SEND_ENABLED=false
WHATSAPP_EVENT_SYNC_ENABLED=false
```

Nenhum `DATABASE_URL` de produção em E2E. Allowlist de números. Callbacks só para staging.

---

## Fora (cortado / rejeitado)

- Go-live em produção
- Cadência automática D0/D+2/D+5/D+9 via API (o playbook manual do Sprint 0 permanece)
- Disparo em massa / fila de prospecção sem consentimento
- Chatbot, sequências AI, SDR
- Substituir `wa.me` nesta fase
- Expor APIs no browser
- Modelo `Tenant` no Prospecta
- Campaign entity / dashboard de conversão
- Auto-classificar interesse pelo NLP da mensagem
- Copiar score/pipeline para a DevFlow
- Alterar pesos, pitch-base, nicho, cidade, owner do lote Santos

---

## Recorte (não confundir)

```text
Infraestrutura pronta ≠ envio habilitado ≠ autorização comercial
```

| Conceito | Estado neste corte |
| --- | --- |
| Infraestrutura / contrato | **BUILD** documental; código nas fatias A–E |
| Envio habilitado | **não** — flags `false`; sem DevFlow; sem mensagem |
| Autorização comercial (go-live) | **DEFER** — grill próprio depois da homologação |

Disparo em massa: **REJECT**.

Após o **merge desta PR**, a próxima fatia é **somente**:

```text
Fatia A — WhatsApp Contact Eligibility
```

Pode alterar o Prospecta (schema + Lead Detail). **Não** chama a DevFlow. **Não** envia mensagem. Resultado: classificar `UNKNOWN` → `OPTED_IN` ou `OPTED_OUT` com fonte, finalidade, data, auditoria e bloqueio de UI. Cancela fechada.

## Divisão em PRs

| # | Título sugerido | Repo |
| --- | --- | --- |
| 1 | `docs: define Prospecta WhatsApp ecosystem contract` | Prospecta (este corte) |
| 2 | `feat(leads): add WhatsApp contact eligibility` | Prospecta |
| 3 | `feat(whatsapp): link Prospecta leads to inbox threads` | DevFlow (+ tipos no Prospecta se necessário) |
| 4 | `feat(integration): add signed Prospecta DevFlow APIs` | Prospecta + DevFlow |
| 5 | `feat(whatsapp): support approved template messages` | DevFlow (+ catálogo no Prospecta) |
| 6 | `feat(integration): sync WhatsApp events to Prospecta` | Prospecta + DevFlow |
| 7 | `test(e2e): validate WhatsApp ecosystem in staging` | ambos |
| 8 | `docs: add WhatsApp operations and incident runbook` | Prospecta (rascunho já em [runbook](whatsapp-operations-runbook.md)) |

Não misturar fatias. Não ligar flags em produção nestas PRs.

---

## Critério de “pronto para iniciar” (go-live ainda DEFER)

Só considerar a **estrada** pronta quando:

- consentimento modelado;
- opt-out bloqueia contato via API;
- telefone em E.164;
- lead e thread com vínculo único;
- templates aprovados na Meta (staging);
- APIs internas assinadas;
- eventos idempotentes;
- Activities automáticas com origem técnica;
- staging passa ponta a ponta;
- feature flags funcionam;
- rollback documentado;
- operadores sabem: Prospecta = elegibilidade + outcome; DevFlow = conversa;
- nenhum teste mutável aponta para produção.

Ligar a cancela exige **Product Grill — WhatsApp API Go-Live v1**, separado.
