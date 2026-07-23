# Produto — Prospecta

## Visão

Plataforma de **prospecção B2B** founder-led: cadastrar e organizar empresas-alvo, qualificar leads, registrar contatos (WhatsApp + e-mail) e acompanhar o pipeline até reunião/oportunidade.

**Nome interno:** Prospecta.  
**Natureza do piloto:** produto desenvolvido e validado pelo próprio **time fundador**, operando um processo real de prospecção.

V1: **single-tenant** (sem SaaS multi-tenant público).

## Problema

O time fundador prospecta empresas B2B genéricas com ferramentas dispersas (planilhas, WhatsApp pessoal, e-mail). Falta um lugar único para ver o próximo passo, registrar histórico e não perder follow-up.

## Time fundador

```text
Time fundador:
- 1 sócio responsável por produto e tecnologia
- 2 sócios responsáveis pela validação comercial e operação
```

| Sócio (sociedade) | Foco operacional | Responsável final por |
| --- | --- | --- |
| Gustavo — Sócio de Produto e Tecnologia | Desenvolvimento, arquitetura, segurança, deploy, métricas, roadmap | Produto e sistema |
| Sócio 2 — Sócio Comercial / Prospecção | ICP, listas, abordagens, execução, objeções, disposição de compra | Validação comercial |
| Sócio 3 — Sócio de Operações / Relacionamento | Organização de leads, retornos, pipeline, follow-ups, usabilidade | Operação do pipeline |

Governança societária: [founding/roles-and-governance.md](founding/roles-and-governance.md).  
**Sociedade (`PARTNER`) ≠ permissão no app (`ADMIN` \| `MEMBER`).**

## Sociedade vs permissões no sistema

| Papel no sistema | Pode | Não pode (V1) |
| --- | --- | --- |
| `ADMIN` | Tudo de `MEMBER` + import CSV, usuários/roles, excluir lead, export CSV | — |
| `MEMBER` | Criar/editar leads, owner, stages, atividades, abrir WhatsApp/e-mail | Import, gestão de usuários, delete de lead, export completo |

Bootstrap: Gustavo `ADMIN`; sócios comercial e operacional `MEMBER`.  
Futuro técnico (não societário): `OWNER` / `ADMIN` / `MEMBER` — **fora da V1**.

## ICP (V1)

- Empresas B2B genéricas; dono da definição fina = Sócio Comercial.
- Cadastro exige dados mínimos de contato (ver campos abaixo).

---

## V1 — decisões do MVP técnico (BUILD)

Fonte do grill: [product/product-decision-mvp-technical.md](product/product-decision-mvp-technical.md).  
**Decisão: BUILD** — autoriza scaffold + fluxo vertical. **Não** autoriza dashboard, IA, automações ou APIs oficiais.

### Fluxo vertical (aceite)

```text
login
→ criar/importar lead
→ atribuir responsável
→ mover no pipeline
→ registrar atividade
→ abrir WhatsApp/e-mail
→ registrar resultado e próximo passo
```

Regra: **clique no canal ≠ contato**. Stage/histórico só mudam com atividade persistida (e/ou move de stage).

### Pipeline

| Stage | Critério de entrada |
| --- | --- |
| `NEW` | Lead criado/importado |
| `QUALIFIED` | Responsável confirma: dados mínimos ok + encaixa no ICP do momento |
| `CONTACTED` | ≥1 atividade `WHATSAPP` ou `EMAIL` registrada |
| `MEETING` | Reunião agendada (`MEETING_SCHEDULED` ou move com data em `nextFollowUpAt`) |
| `WON` | Convertido (manual) — avanço comercial claro |
| `LOST` | Perdido (manual) — `lostReason` obrigatório |

Transições: ver decisão completa. Reabrir `LOST` → `NEW`/`QUALIFIED` exige nota.

| Estado derivado | Definição |
| --- | --- |
| **Parado** | Stage aberto e (`nextFollowUpAt` no passado **ou** sem follow-up e sem atividade ≥7 dias) — filtro, não stage |
| **Perdido** | `LOST` + motivo |
| **Convertido** | `WON` |

### Campos do lead

**Obrigatórios:** `companyName`; `phone` **ou** `email`; `ownerId`; `stage` (default `NEW`).  
**Opcionais:** `contactName`, `title`, `website`, `notes`, `nextFollowUpAt`, `lostReason`, `wonNote`.

### Duplicidade

Após normalizar: mesmo `email` **ou** mesmo `phone` → bloquear create/import com referência ao lead existente.  
Mesmo `companyName` sozinho **não** é duplicata. Sem merge/fuzzy.

### Atividades WhatsApp / e-mail

Tipos: `WHATSAPP` | `EMAIL` | `NOTE` | `STAGE_CHANGE`.  
Handoff: abrir `wa.me` / `mailto` com template → registrar outcome + `nextFollowUpAt` (obrigatório se stage aberto).  
Outcomes: `SENT_NO_REPLY` | `REPLIED` | `NOT_INTERESTED` | `INTERESTED` | `MEETING_SCHEDULED` | `WRONG_CONTACT` | `OTHER`.

### Canais

| Canal | Como | Fora |
| --- | --- | --- |
| WhatsApp | `wa.me` + template | Business API |
| E-mail | `mailto` / template | ESP / cold em massa |

### Fora da V1

Dashboard/analytics complexo, IA, sequências, LinkedIn automation, discador, WhatsApp API, enrichment pago, multi-tenant, billing, SSO, `OWNER`, notificações do sistema, app nativo, Express separado.

### Métricas do piloto

- Leads / semana  
- % abertos com próximo passo ou `WON`/`LOST`  
- Follow-ups em atraso + leads parados  
- Atividades WhatsApp/e-mail / semana  
- `MEETING` e `WON`  
- Feedback de usabilidade dos `MEMBER`  

Janela: 2 semanas pós-deploy usável.  
- Operação do app: [product/pilot-validation-plan.md](product/pilot-validation-plan.md)  
- Piloto comercial (tese): [product/founder-pilot.md](product/founder-pilot.md)  
- Execução do piloto (manual dos sócios): [product/founder-pilot-execution.md](product/founder-pilot-execution.md)

### Critérios de aceite do BUILD

Cumpridos na [decisão do MVP](product/product-decision-mvp-technical.md) (fluxo, stages, campos, dedupe, ACL, atividades, estados, métricas, fora de escopo, owners).

---

## Classificação de requisitos

| Tipo | Significado | Exemplo |
| --- | --- | --- |
| **PLATFORM** | Auth, roles `ADMIN`/`MEMBER` | Login |
| **WORKSPACE** | CRM/pipeline | Stages, atividades, CSV |
| **PILOT_SPECIFIC** | Time fundador atual | Seed dos 3 sócios |

## Estágio atual

```text
FASE 0–5 — MVP técnico (Auth → Lead → Activity → Pipeline) = feito
→ FASE 6 — piloto fundador (14 dias; aquisição manual; oferta de sites)
→ automação Maps / Places API = DEFER até evidência do piloto
```

Detalhe do piloto comercial: [product/founder-pilot.md](product/founder-pilot.md).

Checklist societário segue **em paralelo** e não bloqueia o BUILD do fluxo vertical.

## Fonte da verdade

| Fonte | Uso |
| --- | --- |
| `docs/product.md` | Este documento (resumo normativo V1) |
| `docs/product/product-decision-mvp-technical.md` | Grill + decisões detalhadas |
| `docs/product/pilot-validation-plan.md` | Validação técnica/operacional do piloto |
| `docs/product/founder-pilot.md` | Piloto comercial (tese, métricas, DEFER Maps) |
| `docs/product/founder-pilot-execution.md` | Manual operacional dos sócios (14 dias) |
| `docs/product/pilot-day-1-checklist.md` | Checklist pré–dia 1 / Pilot Day 1 Ready |
| `docs/adr/0009-google-places-lead-ingestion.md` | Ingestão externa → CRM (accepted; BUILD fatia 1) |
| `docs/adr/0010-lead-intelligence-pipeline.md` | Lead Intelligence pipeline (accepted; BUILD fatia 1) |
| `docs/founding/roles-and-governance.md` | Sociedade vs sistema |
| `.cursor/rules/` | Convenções de engenharia |
| Código em `src/` e `prisma/` | Implementação |

Conflito: **produto/docs > rules > preferência do agente**.
