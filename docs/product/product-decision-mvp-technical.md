# Product Decision — MVP técnico (fluxo vertical)

Registro do **product-grill** + artefatos `prospect-quality` e `revenue-centric-design`.  
Autoriza scaffold e o primeiro fluxo ponta a ponta. Não autoriza dashboard, IA, automações ou APIs oficiais.

## Product Decision

### 1. Problema

O time fundador opera prospecção B2B em planilha + WhatsApp + e-mail dispersos. Sem um fluxo único, leads ficam sem dono, sem próximo passo e sem histórico confiável. O MVP técnico precisa tornar operável o processo real dos três sócios — não um CRM genérico.

### 2. Evidência

| Tipo | Conteúdo |
| --- | --- |
| Fato | Time fundador definido (3 sócios); framing founder-led e papéis `ADMIN`/`MEMBER` já documentados |
| Fato | Workaround atual é planilha + apps externos (declarado pelos fundadores) |
| Hipótese | Um fluxo vertical mínimo no app reduz follow-ups perdidos e aumenta registro de atividade |
| Incerteza | Ainda não há métricas históricas no Prospecta (greenfield); ICP fino ainda é do sócio comercial |

### 3. Hipótese

Se os três sócios conseguirem operar ponta a ponta  
`login → lead → responsável → pipeline → atividade → WhatsApp/e-mail → resultado + próximo passo`  
sem planilha paralela, então em 2 semanas após deploy usável: (a) ≥70% dos leads abertos terão próximo passo ou stage terminal, e (b) os dois `MEMBER` usarão o app sem ajuda técnica contínua.

### 4. Comportamento esperado

- Todo lead tem **responsável** e **stage** explícitos.
- Contato WhatsApp/e-mail só conta no pipeline depois de **atividade registrada** (clique ≠ contato).
- Lead aberto sempre tem **próximo passo** (`nextFollowUpAt`) ou está em stage terminal.
- `MEMBER` opera o dia a dia; `ADMIN` configura usuários e importação.

### 5. Métrica (piloto — observação manual ok)

| Métrica | Como observar |
| --- | --- |
| Leads criados / semana | Contagem no app |
| % leads abertos com `nextFollowUpAt` futuro **ou** stage `WON`/`LOST` | Lista + filtro |
| Follow-ups em atraso | `nextFollowUpAt` antes de hoje em stage aberto |
| Leads **parados** (stale) | Ver definição abaixo |
| Atividades WhatsApp/e-mail / semana | Contagem por tipo |
| Reuniões (`MEETING`) e conversões (`WON`) | Contagem de stage |
| Usabilidade `MEMBER` | Check-in semanal (qualitativo) |

### 6. Menor implementação (autorizada)

Scaffold Next.js fullstack + Prisma + auth cookie + models User/Lead/Activity + UI mínima do fluxo vertical. Sem dashboard analítico.

### 7. Classificação

**WORKSPACE** (núcleo), com fatia **PLATFORM** (auth + roles) incluída no mesmo BUILD.

### 8. Decisão

**BUILD**

### 9. Justificativa

Há time real, problema operacional declarado, escopo vertical fechado e risco maior de overbuilding do que de “validar demais”. O checklist societário segue em paralelo e **não bloqueia** este BUILD. Greenfield exige implementação mínima para gerar evidência de uso.

### 10. Artefato da decisão (escopo autorizado)

Ver seção [Decisões V1 fechadas](#decisões-v1-fechadas) abaixo e `docs/product.md`.

### 11. Responsável pela validação

| Área | Owner |
| --- | --- |
| Produto / métricas de uso | Gustavo (Produto e Tecnologia) |
| Qualidade comercial / ICP | Sócio Comercial |
| Disciplina de pipeline / usabilidade | Sócio de Operações |

### 12. Prazo de validação

2 semanas após o primeiro deploy usável do fluxo vertical.

### 13. Evidência que mudaria a decisão

- Sócios `MEMBER` abandonam o app em favor da planilha na 1ª semana → REDUCE SCOPE da UI ou REJECT de features extras; reavaliar fricção.
- Duplicidade ou PII quebram confiança → priorizar correção (exception de integridade) antes de novas features.

---

## Decisões V1 fechadas

### Fluxo exato (entrada → conversão)

```text
1. Login (ADMIN ou MEMBER)
2. Criar lead (MEMBER/ADMIN) ou importar CSV (ADMIN)
3. Atribuir responsável (owner) — default: usuário atual
4. Qualificar: NEW → QUALIFIED (critérios abaixo)
5. Contatar: abrir WhatsApp e/ou e-mail a partir do lead
6. Registrar atividade do canal + resultado + nextFollowUpAt
7. Avançar stage conforme critérios (CONTACTED → MEETING → WON/LOST)
8. Em todo stage aberto: manter próximo passo visível
```

Regra crítica: **abrir** `wa.me` / `mailto` **não** altera stage sozinho. Stage e histórico mudam só com **atividade persistida** (e movimento de stage explícito ou regra automática leve documentada abaixo).

### Pipeline — stages e critérios objetivos

| Stage | Significado | Entra quando | Sai quando |
| --- | --- | --- | --- |
| `NEW` | Entrou no CRM; ainda não liberado para outreach | Create/import | Move para `QUALIFIED` ou `LOST` |
| `QUALIFIED` | Pronto para contato (dados mínimos + encaixa no ICP do momento) | Responsável confirma qualificação | Primeira atividade `WHATSAPP` ou `EMAIL` → pode ir a `CONTACTED`; ou `LOST` |
| `CONTACTED` | Houve ao menos um outreach registrado | Existe ≥1 atividade `WHATSAPP` ou `EMAIL` | Resposta/progresso → `MEETING` ou `LOST`; ou segue com follow-ups |
| `MEETING` | Reunião agendada com data | Atividade/resultado `MEETING_SCHEDULED` **ou** move manual com `nextFollowUpAt` = data da reunião | Após reunião: `WON` ou `LOST` (ou volta a `CONTACTED` se remarcar — preferir nova atividade) |
| `WON` | Convertido | Decisão manual do responsável | Terminal |
| `LOST` | Perdido / descartado | Decisão manual com **motivo obrigatório** | Terminal |

Transições permitidas (V1):

```text
NEW → QUALIFIED | LOST
QUALIFIED → CONTACTED | LOST
CONTACTED → MEETING | LOST | (permanece CONTACTED com novos follow-ups)
MEETING → WON | LOST | CONTACTED
WON → (nenhuma)
LOST → NEW | QUALIFIED   # reabrir só com nota obrigatória
```

Atalho permitido no server: ao criar a **primeira** atividade `WHATSAPP`/`EMAIL` em `QUALIFIED` (ou `NEW` se o usuário pular qualificação com confirmação), sugerir/auto-mover para `CONTACTED`.  
Pular `QUALIFIED` exige confirmação explícita na UI (“contatar sem qualificar”).

### Parado, perdido, convertido

| Estado | Definição objetiva |
| --- | --- |
| **Parado (stale)** | Stage ∈ {`NEW`,`QUALIFIED`,`CONTACTED`,`MEETING`} **e** (`nextFollowUpAt` antes do início do dia local **ou** (`nextFollowUpAt` nulo **e** sem atividade há ≥7 dias)) |
| **Perdido** | Stage = `LOST` + `lostReason` preenchido |
| **Convertido** | Stage = `WON` — reunião ocorreu (ou aceite explícito) e há avanço comercial claro; `wonNote` recomendado |

`parado` **não** é stage — é filtro/lista “Precisa de atenção”.

### Campos do lead

**Obrigatórios**

| Campo | Regra |
| --- | --- |
| `companyName` | string não vazia (trim) |
| `phone` **ou** `email` | ao menos um válido |
| `ownerId` | usuário ativo do workspace |
| `stage` | default `NEW` |

**Opcionais V1:** `contactName`, `title`, `website`, `notes`, `nextFollowUpAt`, `lostReason`, `wonNote`.

**Rejeitar:** create/import sem empresa; sem telefone e sem e-mail; e-mail inválido; telefone sem dígitos suficientes (menos de 10 dígitos após normalizar).

### Normalização (server)

- `email`: trim + lowercase
- `phone`: apenas dígitos; se 10/11 dígitos BR, prefixar `55` ao gerar `wa.me`
- `website`: trim; strip UTM básicos se trivial
- `companyName`: trim; colapsar espaços

### Duplicidade (V1)

Duplicata se **qualquer** for verdadeiro após normalizar:

1. `email` igual a lead existente (quando ambos têm e-mail), ou
2. `phone` igual a lead existente (quando ambos têm telefone)

**Não** é duplicata: mesmo `companyName` com canais diferentes.

Comportamento: **bloquear** create/import da linha/registro; mensagem com link/id do lead existente. Sem merge automático. Sem fuzzy match.

### `ADMIN` vs `MEMBER`

| Ação | `ADMIN` | `MEMBER` |
| --- | --- | --- |
| Login / ver todos os leads (tenant único) | sim | sim |
| Criar/editar lead, mudar stage, atividades, owner | sim | sim |
| Abrir WhatsApp / e-mail + templates | sim | sim |
| Import CSV | sim | **não** |
| Convidar/desativar usuário / mudar role | sim | **não** |
| Excluir lead (destrutivo) | sim | **não** |
| Export CSV completo | sim | **não** (V1) |

Sociedade `PARTNER` não aparece no ACL.

### Atividades WhatsApp e e-mail

**Tipos:** `WHATSAPP` | `EMAIL` | `NOTE` | `STAGE_CHANGE` (sistema).

**Fluxo de handoff**

1. Usuário clica “Abrir WhatsApp” ou “Abrir e-mail”.
2. App abre `wa.me` / `mailto` com template determinístico (snapshot do texto usado).
3. App exige registro imediato (mesmo fluxo/modal): canal, `outcome`, nota opcional, `nextFollowUpAt` (obrigatório se stage continuar aberto).
4. Persistir atividade **antes** de considerar o contato “feito” no CRM.

**Outcomes V1:** `SENT_NO_REPLY` | `REPLIED` | `NOT_INTERESTED` | `INTERESTED` | `MEETING_SCHEDULED` | `WRONG_CONTACT` | `OTHER`.

- `NOT_INTERESTED` / `WRONG_CONTACT` → UI sugere `LOST` (não força).
- `MEETING_SCHEDULED` → UI sugere `MEETING` + data no `nextFollowUpAt`.

Clique sem salvar atividade = handoff incompleto (não mexe stage).

### Fora da V1 (explícito)

- Dashboard / analytics complexo / funil gráfico
- IA, sequências, automações multi-step
- WhatsApp Business API, ESP de e-mail, LinkedIn, discador
- Enrichment pago, fuzzy dedupe, merge de leads
- Multi-tenant, billing, SSO, role `OWNER`
- Notificações push/e-mail do sistema
- App nativo

### Critérios de aceite para iniciar o BUILD (scaffold + fluxo)

Checklist — todos devem estar **sim** (este documento fecha a lista):

- [x] Fluxo vertical definido ponta a ponta
- [x] Stages + critérios objetivos
- [x] Campos obrigatórios + rejeições
- [x] Regras de duplicidade
- [x] Matriz `ADMIN` / `MEMBER`
- [x] Modelo de atividade WhatsApp/e-mail (clique ≠ contato)
- [x] Definição parado / perdido / convertido
- [x] Métricas do piloto
- [x] Fora da V1 explícito
- [x] Owners de validação + janela de 2 semanas
- [x] Decisão do grill = **BUILD**

---

## Prospect quality (resumo)

- Obrigatórios: empresa + (telefone ou e-mail) + owner + stage.
- CSV: só `ADMIN`; linha inválida falha com erro por linha; duplicata bloqueia.
- Correção de dado ruim: na UI do lead (qualquer `MEMBER`/`ADMIN`), não só reimport.

## Revenue-centric design (fluxo vertical)

1. **Objetivo:** registrar contato e próximo passo sem voltar à planilha.  
2. **Atual:** planilha + WhatsApp/e-mail sem histórico unificado.  
3. **Desejado:** após cada handoff, atividade + follow-up salvos em menos de 1 min.  
4. **Fricção principal:** esquecer de registrar depois que o app externo abre.  
5. **Hipótese:** (igual ao grill).  
6. **Métrica primária:** % leads abertos com próximo passo ou terminal.  
7. **Proteção:** não aumentar campos obrigatórios a ponto de bloquear cadastro; não confundir clique com contato.  
8. **Menor alteração:** uma tela de lead detail + ações de canal + modal de atividade; lista com filtro “parados” / follow-ups atrasados.  
9. **Risco:** modal ignorado → mitigar com estado “handoff pendente” leve se necessário (V1.1 se o piloto mostrar abandono).  
10. **Validação:** 2 semanas; owners por área.  
11–15. Success/adjustment/stop: ver `docs/product/pilot-validation-plan.md`.
