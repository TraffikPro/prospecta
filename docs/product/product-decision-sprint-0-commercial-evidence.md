# Product Decision — Sprint 0 Commercial Evidence

- **Data:** 2026-08-18
- **Decisão:** **VALIDATE** (ciclo de evidência) — **não é feature**
- **Classificação:** PILOT_SPECIFIC (Santos / Odontologia) · WORKSPACE (uso do CRM já entregue)
- **Pré-requisito:** mapa de telas FREEZE ([pilot-screen-map](product-decision-pilot-screen-map.md)) · playbook UI (#65) · lote 1 ([campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md))
- **Não autoriza:** alterar score, pesos, pitch-base, nicho, cidade, owner, processo de contato; entidade Campaign; dashboard de conversão; CSV; IA; sequências; **envio** WhatsApp API; telas novas. Readiness (contrato/flags off): [whatsapp-ecosystem-readiness-v1](product-decision-whatsapp-ecosystem-readiness-v1.md).

## Problema

```text
5 leads
0 Activities confirmadas
```

O sistema e o playbook existem. Não há evidência de execução suficiente para revisar score, oferta ou produto.

## Hipótese

Se o comercial trabalhar 25–30 HIGH com as **mesmas** variáveis (Santos, Odontologia, pesos atuais, abordagem atual) e registrar Activity + outcome, então o time consegue decidir o score com dados — não com opinião.

## Métrica (encerrar o Sprint 0)

```text
≥20 leads com tentativa registrada
≥20 Activities
outcomes preenchidos
follow-ups preenchidos quando necessários
feedback dos operadores coletado
custo do Google Places registrado
```

Alvo operacional: **25–30 leads trabalhados**, com primeiros sinais de resposta e reunião.

## Fluxo (inalterado)

```text
login → Minha fila → lead → playbook → WhatsApp manual → Activity
```

Copiar mensagem ou abrir WhatsApp **não** conta. Activity persistida é a verdade.

## Execução

### 1. Fechar os cinco leads atuais (lote 1)

Para cada lead Santos já na carteira:

- tentativa de contato;
- registrar Activity;
- selecionar outcome;
- definir follow-up quando o app exigir;
- avaliar qualitativamente a qualidade do lead (nota no body / observação — **sem campo novo**).

Protocolo e nomes do lote: [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md).  
Cadência e copy: [playbook-v1.md](../commercial/playbook-v1.md).

### 2. Segunda onda

Manter:

```text
Cidade: Santos
Nicho: Odontologia
Score: pesos atuais
Pitch: abordagem atual
Owner: Comercial
```

Campanha sugerida (JSON `intelligence.campaign`, **sem** entidade Campaign):

```text
santos-odontologia-2026-07-wave-2
```

No **`prospecta-lead-generator`** (repositório **externo**, não este CRM), nesta ordem:

```bash
npm run collect
npm run qualify
npm run sync
```

Revisar os arquivos entre cada etapa. Sincronizar **somente** os leads aprovados. Não alterar pesos/sinais no qualify. Registrar o **custo Google Places** do `collect` (billing / log do generator) neste ciclo — sem campo novo no CRM.

Não executar collect/sync a partir do repositório Prospecta. Aquisição self-serve na UI permanece débito/adiada neste sprint.

### 3. Freeze durante o lote

Não alterar:

```text
score
pesos
pitch-base
nicho
cidade
owner
processo de contato
```

Comparação inválida se qualquer um desses mudar no meio.

## Dados obrigatórios (já existem no app)

| Dado | Onde | Uso |
| --- | --- | --- |
| Score | inteligência do lead | comparar previsão |
| Qualidade percebida | nota / body da Activity | validar o ICP |
| Activity | formulário no detalhe | comprovar execução |
| Outcome | outcome da Activity | medir resposta |
| Follow-up | `nextFollowUpAt` quando exigido | medir continuidade |
| Stage | pipeline / detalhe | medir avanço |
| Motivo de perda | `lostReason` se `LOST` | aprender objeções |
| Campanha | `intelligence.campaign` | separar ondas |

Não criar planilha paralela como verdade. Prospecta permanece a fonte.

## Checklist do operador (hoje)

1. Login → **Minha fila**.
2. Abrir o próximo HIGH Santos (lote 1, nesta ordem: Comsorriso → … → Drª Ariany).
3. Ler diagnóstico + playbook (D0 / D+2 / D+5 / D+9 conforme o caso).
4. Contato **manual** no WhatsApp.
5. Registrar **Activity** (`WHATSAPP` + outcome). Copiar/abrir o app **não** fecha o lead.
6. Follow-up se o outcome exigir (`SENT_NO_REPLY` → data da cadência).
7. No body: qualidade percebida em uma linha (encaixa / duvidoso / fora — **por quê**).
8. Se `LOST`: `lostReason` obrigatório.

Engenharia neste ciclo: onda 2 no generator **depois** do lote 1 com Activities. Sem mudar score/pitch. Trilha paralela: contrato WhatsApp / flags off — **sem disparo real**.

## Grill

| Campo | Valor |
| --- | --- |
| Problema | 5 HIGH, 0 Activity confirmada; não dá para revisar score |
| Evidência | lote 1 documentado; playbook e fila prontos |
| Hipótese | volume com variáveis fixas gera dados de resposta/reunião |
| Métrica | ≥20 tentativas + ≥20 Activities + outcomes |
| Menor corte | operar o CORE PILOT; onda 2 no generator; sem código no Prospecta |
| Não fazer | Qualification Score Review agora; Campaign entity; dashboard |

## Próximo grill (somente ao encerrar)

```text
Product Grill — Qualification Score Review v1
```

Esse grill decide, **com os dados deste sprint**:

- KEEP dos pesos atuais;
- ADJUST com evidência;
- remover sinais sem correlação;
- adicionar sinais observados;
- separar score de prioridade comercial.

Até esse checkpoint: Campaign, dashboard de conversão e o restante do NOT YET permanecem adiados.

## Fora deste ciclo

- Corrigir débito MEMBER / Aquisição na nav
- Qualquer BUILD no mapa congelado
- Mudar o playbook por palpite (objeções entram no catálogo de fricção; copy nova só depois do grill)
