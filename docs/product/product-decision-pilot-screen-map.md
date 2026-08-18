# Product Decision — Pilot screen map (freeze)

- **Data:** 2026-08-17
- **Decisão:** **VALIDATE** (congelar o mapa de telas) — não autoriza tela nova
- **Classificação:** WORKSPACE (IA comercial) · PILOT_SPECIFIC (execução do lote)
- **Pré-requisito:** F1–F4, KPIs, dashboard, badges, playbook docs (#64) e playbook UI (#65) em `main`
- **Não autoriza:** transformar `/app` no centro da execução; inventar telas; corrigir Aquisição MEMBER neste corte; funil, CSV, gestão de usuários, IA, sequências; **envio** WhatsApp API / go-live

## Fluxo oficial do piloto

```text
login
→ Minha fila
→ detalhe do lead
→ playbook WhatsApp
→ contato manual
→ Activity
```

Telas críticas: `/app/my-leads` e `/app/leads/[id]`.

`Visão geral`, `Inteligência`, `Pipeline` e `Portfólio` são **suporte**. Não são o centro da execução.

## Mapa congelado

```text
CORE PILOT
Minha fila
Detalhe do lead
Playbook
Activity

SUPPORT
Visão geral
Inteligência
Pipeline
Portfólio

ADMIN OPS
Aquisição
Revisão HIGH
Equipe

NOT YET
Funil de conversão
CSV
Gestão de usuários
IA de mensagens
Sequências automáticas
WhatsApp API (envio / go-live)
```

Readiness (contrato, elegibilidade, flags `false`) é BUILD paralelo — [whatsapp-ecosystem-readiness-v1](product-decision-whatsapp-ecosystem-readiness-v1.md). **Não** é rota nova e **não** liga envio. `wa.me` permanece o CORE PILOT.

## Grill

| Campo | Valor |
| --- | --- |
| Problema | Ampliar superfície (dashboard como hub, telas novas) antes de evidência de execução |
| Evidência | Inventário de rotas em `main` @ #65; playbook VALIDATE; lote Santos sem critério de “scripts existem” |
| Hipótese | Operar o caminho real gera Activity/resposta; fricção observada escolhe o próximo corte |
| Métrica | Activities WhatsApp no detalhe do lead (cadência + outcome) |
| Menor corte | Este freeze + débito conhecido de Aquisição |
| Não fazer | Feature comercial sem fricção no CORE PILOT |

Próximo BUILD comercial só se o operador travar **nesse** caminho, por exemplo:

| Fricção observada | Próximo corte |
| --- | --- |
| Objeções repetidas | suporte a objeções no detalhe do lead |
| Não sabe quando seguir | follow-up / cadência no app |
| Reuniões marcadas | discovery |

Sem fricção observada: **não ampliar**.

## Débito conhecido — Aquisição na nav

MEMBER com `canRunAcquisition` **vê** Aquisição na navegação (`visibility: "acquisition"`).

`/admin/acquisition` continua `requireRole(..., "ADMIN")` e responde **403**.

A decisão original ([acquisition self-serve](product-decision-acquisition-self-serve-v1.md)) previa ADMIN **ou** MEMBER opted-in. Nav e página divergem.

- **Não bloqueia** o piloto de WhatsApp.
- **Fora do fluxo principal** até grill + correção explícita.
- Não “securizar” escondendo o item só no client: ou a rota autoriza o MEMBER opted-in, ou a nav deixa de prometê-lo.

## Relação com o resto do sistema

```text
F1–F4 = DONE
KPIs = DONE
DASHBOARD = DONE          (suporte; não vira hub)
BADGES = DONE
PLAYBOOK DOCS = VALIDATE
PLAYBOOK UI = VALIDATE UI
SCREEN MAP = FREEZE agora
SPRINT 0 = VALIDATE — evidência comercial
WHATSAPP READINESS = BUILD docs / flags off (envio = NOT YET)
```

Ciclo operacional corrente: [product-decision-sprint-0-commercial-evidence.md](product-decision-sprint-0-commercial-evidence.md). Sem rota nova até o checkpoint. Readiness WhatsApp não descongela envio.
