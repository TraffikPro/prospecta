# Product Decision — WhatsApp Contact Eligibility v1 (Fatia A)

- **Data:** 2026-08-18
- **Decisão:** **BUILD** (somente Fatia A — domain + UI informativa)
- **Classificação:** PLATFORM (consentimento / LGPD) · WORKSPACE (Lead Detail)
- **Pré-requisito:** contrato oficial em `main` — [whatsapp-ecosystem-contract-v1.md](whatsapp-ecosystem-contract-v1.md) · [readiness v1](product-decision-whatsapp-ecosystem-readiness-v1.md) · ADR [0015](../adr/0015-whatsapp-ecosystem-readiness.md) (merge [#67](https://github.com/TraffikPro/prospecta/pull/67))
- **Este PR:** só este documento. Código = PR seguinte, branch limpa após o merge da decisão.
- **Não autoriza:** DevFlow, Cloud API, thread, template, webhook, Activity automática, cadência, go-live, disparo em massa, flags `true`, alterar o `wa.me` do Sprint 0

## Recorte

```text
Infraestrutura pronta ≠ envio habilitado ≠ autorização comercial
```

Estado de elegibilidade nesta fatia é **informativo**. `OPTED_IN` **não** liga envio. Flags permanecem `false`. Go-live exige grill próprio.

```text
UNKNOWN
→ operador registra evidência
→ OPTED_IN ou OPTED_OUT
→ estado apenas informativo nesta fatia
```

---

## Product Decision

### 1. Problema

O CRM tem telefone (`wa.me`) e não tem **autorização** rastreável. Sem status, origem, finalidade, data da evidência, autor e trilha append-only, o próximo passo de API seria envio sem prova — ou um opt-out apagado.

### 2. Evidência

| Tipo | Conteúdo |
| --- | --- |
| Fato | Contrato v1 em `main`: Places ⇒ `UNKNOWN`; eventos técnicos ≠ outcome comercial |
| Fato | `Lead.phone` não é E.164; handoff Sprint 0 é `wa.me` |
| Fato | Flags de envio documentadas `false` |
| Hipótese | Classificar no lead, com evidência obrigatória, reduz risco sem ligar a API |
| Incerteza | Volume real de opt-in no lote Santos (Sprint 0 VALIDATE) |

### 3. Hipótese

Se `ADMIN` e `MEMBER` puderem ler o estado e registrar evidência no Lead Detail, com `OPTED_IN` rejeitado no servidor sem fonte/finalidade/data/E.164, então o lote fica classificado sem confundir prontidão com go-live.

### 4. Comportamento esperado

Ver [domínio fechado](#domínio-fechado) e [UI](#ui-lead-detail).

### 5. Métrica (manual ok)

| Métrica | Como observar |
| --- | --- |
| Lead existente / Places → `UNKNOWN` | pós-migration e ingestão |
| `OPTED_IN` inválido | zero persistido (teste server-side) |
| Histórico após recusa / novo opt-in | eventos anteriores visíveis |
| Flags / HTTP externo | inalterados / zero |
| `wa.me` Sprint 0 | separado visualmente; ainda funciona |

### 6. Menor implementação (PR de código, não esta)

Schema + migration conservadora + actions + seção no Lead Detail + testes da [lista mínima](#critérios-mínimos-da-implementação). Sem rota nova.

### 7. Classificação

**PLATFORM** + **WORKSPACE**.

### 8. Decisão

**BUILD** — Fatia A somente.

### 9. Justificativa

A fatia-mãe (#67) autorizou elegibilidade. Este grill **fecha o domínio** para a implementação não improvisar consentimento, E.164, ACL ou copy.

### 10. Artefato

Este documento.

### 11. Responsável

| Área | Owner |
| --- | --- |
| Implementação após merge desta decisão | Gustavo (Produto e Tecnologia) |
| Registro de evidência no piloto | `ADMIN` e `MEMBER` |
| Sprint 0 `wa.me` | inalterado |

### 12. Prazo

Merge desta decisão → branch **limpa** a partir de `main` → `feat(leads): add WhatsApp contact eligibility`. Fatia B (thread) só depois.

### 13. Evidência que mudaria a decisão

- Esconder `wa.me` quando `UNKNOWN` → novo grill (quebra Sprint 0).
- Enviar template quando `OPTED_IN` → grill de go-live, não Fatia A.

---

## IN / OUT

**IN**

```text
- status UNKNOWN | OPTED_IN | OPTED_OUT
- origem, finalidade e data
- auditoria das alterações
- telefone normalizado E.164
- UI de consulta e registro
- bloqueio visual para contato inelegível
```

**OUT**

```text
- chamadas à DevFlow
- Cloud API
- criação de thread
- templates
- webhooks
- Activities automáticas
- cadências
- alteração do fluxo wa.me do Sprint 0
```

Também fora: ligar flags; `POST /api/internal/whatsapp/events`; botão “Enviar template”; inferir opt-in no sync Places; Campaign entity; `Tenant` no Prospecta.

---

## Domínio fechado

Contrato TypeScript de domínio (implementar na PR de código; não nesta).

```ts
type WhatsAppConsentStatus = "UNKNOWN" | "OPTED_IN" | "OPTED_OUT";

type WhatsAppConsentSource =
  | "PHONE_CALL"
  | "EMAIL"
  | "FORM"
  | "INBOUND_WHATSAPP"
  | "OTHER";

/** Controlled purpose — not free-form commercial copy. */
type WhatsAppConsentPurpose =
  | "PRESENTATION"
  | "DEMO"
  | "MEETING"
  | "FOLLOW_UP"
  | "OTHER";
```

### Estado corrente (Lead)

| Campo | Regra |
| --- | --- |
| `whatsappConsentStatus` | default **`UNKNOWN`** |
| `phoneE164` | **`null` enquanto o status for `UNKNOWN`** |
| `Lead.phone` | legado; não reescrito nesta fatia |

Leads **já existentes** após a migration: `UNKNOWN`, `phoneE164 = null`.  
Ingestão Places **com telefone**: `UNKNOWN`, `phoneE164 = null`.

A UI pode **sugerir** um E.164 a partir dos dígitos legados no formulário de autorização. Persistir `phoneE164` só na mutação `OPTED_IN` bem-sucedida. Não backfill na migration.

### Evento de histórico (append-only)

Um registro novo a cada autorização ou recusa. **Sem update e sem delete pela UI** (nem “editar evidência”). Sem API de correção nesta fatia.

| Campo | Obrigatório | Notas |
| --- | --- | --- |
| `leadId` | sim | |
| `status` | sim | só `OPTED_IN` ou `OPTED_OUT` (não gravar evento `UNKNOWN`) |
| `source` | sim | enum acima, inclui `OTHER` |
| `purpose` | se `OPTED_IN` | enum; em `OPTED_OUT` pode ser `null` |
| `purposeNote` | se `purpose = OTHER` no opt-in | trim; 1–200 caracteres; senão `null` |
| `evidenceAt` | sim | data/hora da evidência **informada pelo operador**; distinta de `createdAt` |
| `createdAt` | sim | instante do registro no servidor; imutável |
| `actorId` | sim | usuário autenticado que registrou; nunca nulo |

`UNKNOWN` inicial = ausência de eventos + status default. Não inventar evento sintético na migration.

### `OPTED_IN`

Na **mesma** mutação, server-side:

1. `source` (enum);
2. `purpose` (enum);
3. `purposeNote` se `OTHER`;
4. `evidenceAt`;
5. `phoneE164` válido (persistir neste momento);
6. `actorId`.

Faltou qualquer um → rejeitar. Não confiar no client.

Copy obrigatória no estado `OPTED_IN`:

```text
Autorizado, mas envio pela API ainda indisponível
```

Isso não é go-live.

### `OPTED_OUT`

- Prevalece no **estado atual** sobre qualquer `OPTED_IN` anterior.
- `source` obrigatório (`OTHER` se o operador não souber).
- `purpose` / `purposeNote` / `phoneE164` não exigidos.
- `evidenceAt` + `actorId` obrigatórios.
- Novo `OPTED_IN` depois cria **novo** evento (evidência nova). Opt-out antigo permanece no histórico.

### Histórico vs estado

| Camada | Papel |
| --- | --- |
| Estado no Lead | o que vale agora (`OPTED_OUT` ganha) |
| Eventos | trilha completa; nunca apagada nesta fatia |

### Migration

- Default `UNKNOWN`; `phoneE164` nulo.
- **Não** inferir consentimento a partir de `Lead.phone`.
- **Não** inferir consentimento a partir de Activity (`WHATSAPP` / outcome / body).
- **Não** popular histórico com eventos fictícios.

### ACL (piloto)

| Ação | `ADMIN` | `MEMBER` |
| --- | --- | --- |
| Ler status, E.164, histórico | sim | sim |
| Registrar `OPTED_IN` / `OPTED_OUT` | sim | sim |

Sem papel novo. Autorização **server-side** (sessão). `MEMBER` inativo / sem acesso ao app = 401/403. Sem “securizar” só escondendo o formulário.

Não reutilizar só `AdminAuditEvent` (trilha de ADMIN). Eventos de elegibilidade pertencem ao lead e a `ADMIN`/`MEMBER`.

---

## UI (Lead Detail)

Não é rota nova. Duas zonas **visualmente distintas**:

```text
Contato manual (Sprint 0)
  [Contatar]     → wa.me a partir de Lead.phone
  [E-mail]
  [Registrar resultado]

Canal autorizado (futuro — informativo nesta fatia)
  Telefone E.164: — (vazio se UNKNOWN)
  Elegibilidade: Não verificada | Autorizado | Recusado
  Conversa: Não vinculada

  Se OPTED_IN:
    Autorizado, mas envio pela API ainda indisponível

  [Registrar autorização]   → fonte, finalidade (enum), data da evidência, E.164
  [Registrar recusa]
  Histórico (somente leitura)
```

O `wa.me` **não** mora dentro do bloco “Canal autorizado”. Contatar **não** significa autorizado.

| Estado | Canal autorizado | Contato manual `wa.me` |
| --- | --- | --- |
| `UNKNOWN` | sem envio; CTA de registro | permanece, bloco separado |
| `OPTED_IN` | copy de API indisponível; sem botão de send | permanece, bloco separado |
| `OPTED_OUT` | recusa em vigor; opt-in velho só no histórico | permanece, bloco separado (aviso visível) |
| Sem E.164 persistido | `OPTED_IN` recusado no servidor até informar E.164 válido | `wa.me` se o legado ainda gerar URL |

Sem default `OPTED_IN` no form. Sem one-click sem evidência.

---

## Critérios mínimos da implementação

```text
Lead existente → UNKNOWN
Places com telefone → UNKNOWN
OPTED_IN sem fonte/finalidade/data/E.164 → rejeitado no servidor
OPTED_OUT prevalece no estado atual
Novo opt-in cria novo evento
Histórico anterior permanece
Nenhuma flag é ativada
Nenhuma chamada externa acontece
```

Também: `evidenceAt ≠ createdAt`; `actorId` presente; sem update/delete de evento na UI; leitura e registro para `ADMIN` e `MEMBER`; copy de API indisponível no `OPTED_IN`; `wa.me` em bloco separado.

---

## Sequência de PRs

```text
1. #67 contrato — MERGED
2. Este documento — PR só da decisão
3. feat(leads): add WhatsApp contact eligibility — branch limpa a partir de main
```

Cancela fechada durante toda a prontidão.
