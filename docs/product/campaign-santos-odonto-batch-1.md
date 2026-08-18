# Campanha — Santos Odontologia (Lote 1)

**Status:** Sprint 0 — evidência comercial (**VALIDATE**)  
**Pergunta:** a inteligência gera conversa comercial real?

Ciclo atual: [product-decision-sprint-0-commercial-evidence.md](product-decision-sprint-0-commercial-evidence.md) — fechar estes 5 + segunda onda, **sem** mudar score/pesos/pitch.

## Estado operacional

| Item | Valor |
| --- | --- |
| Campanha | Santos Odontologia 2026-07 (`santos-odontologia-2026-07`) |
| Leads | 5 HIGH (GOOGLE_PLACES) |
| Owner | Comercial (`ysfellipe98@gmail.com`) — MEMBER ativo |
| Activities | 0 → próximo marco = **primeira Activity real** |
| Freeze de produto | score / sinais / pitch / telas / novas cidades |

## Product Decision (VALIDATE)

| Campo | Valor |
| --- | --- |
| Decisão | **VALIDATE** — sem Campaign entity / Workspace / Website Intelligence |
| Motivo | Provar o primeiro ciclo Score → Contato → Resposta → Reunião antes de schema |
| Campanha no dado | Mantém `intelligence.campaign` (JSON), ex.: `santos-odontologia-2026-07` |
| Próximo passo técnico | **Nenhum** até evidência do lote |

### Hipóteses a discriminar (após o lote)

| Hipótese | Sintoma | Próximo produto |
| --- | --- | --- |
| A — Campaign | Precisa comparar Santos vs outra cidade/nicho; atribuição mistura | Campaign Foundation mínima |
| B — Execução | Inbox aberta, sem clareza de “quem contactar hoje” | Commercial Workspace |
| C — Argumento | Respostas sem valor percebido / silêncio forte | Website Intelligence + pitch |

### Critérios para BUILD Campaign Foundation

Abrir schema **somente se**:

1. Segunda campanha na fila **e**
2. Necessidade operacional **recorrente** de atribuição  
   (ex.: “preciso saber quais leads são da campanha X — o comercial está misturando”)

BUILD mínimo (quando autorizado): `Campaign { id, name, createdAt }` + `Lead.campaignId?` — sem métricas, dashboard, status, orçamento ou membros.

## Freeze técnico

Não abrir:

- migration / entidade Campaign
- CRUD / telas de campanha
- dashboard / analytics
- auditoria de site
- IA de abordagem
- novas fontes de aquisição
- Workspace

Próximo avanço = [Sprint 0 — evidência comercial](product-decision-sprint-0-commercial-evidence.md) (fechar estes 5 + wave-2). Sem schema Campaign.

## Campanha

| Campo | Valor |
| --- | --- |
| Nicho | Odontologia |
| Região | Santos |
| Pool HIGH | ~18 (meta) |
| Lote inicial | **5** leads (maiores scores na Inbox) |
| Ferramenta | `/app/my-leads` → lead detail → playbook → Activity |
| Chave JSON | `santos-odontologia-2026-07` |

## Protocolo por lead

### Antes do contato

1. Abrir **Minha fila** → Lead Detail  
2. Ler diagnóstico + pitch  
3. Pergunta mental (30s): *“por que esta empresa é uma oportunidade?”*  
   Se não conseguir explicar, registrar na coluna Observação.

### Ordem de abordagem (não pular / não ampliar)

1. Comsorriso  
2. Clínica Brasil Sorriso - Gonzaga  
3. Lux Estética Odontológica Santos  
4. Centro Santista de Odontologia  
5. Drª Ariany de França Ferreira  

Texto e cadência: [Commercial Playbook V1](../commercial/playbook-v1.md) (sinal → pergunta; D0 / D+2 / D+5 / D+9). Não usar pitch genérico de “soluções digitais”.  

### Após cada contato (obrigatório)

```text
Lead → Activity → Outcome → Next Follow Up
```

| Situação | Type | Outcome | Follow-up |
| --- | --- | --- | --- |
| Sem resposta | WHATSAPP | SENT_NO_REPLY | cadência do [playbook](../commercial/playbook-v1.md) (D+2 / D+5 / D+9) |
| Respondeu | WHATSAPP | REPLIED | next step no body |
| Reunião | WHATSAPP / NOTE | MEETING_SCHEDULED | data da reunião |

Sem Activity não há aprendizado.

### O que não fazer no lote

Não alterar score, pesos, sinais, pitch-base, nicho, cidade, owner, processo de contato, IA de mensagem, dashboard nem website audit. Variável sob teste = Intelligence + oferta + abordagem atuais. Segunda onda: [Sprint 0](product-decision-sprint-0-commercial-evidence.md) (`santos-odontologia-2026-07-wave-2`).

## Acompanhamento do lote (atualizar à mão)

Fonte da verdade = Prospecta. Esta tabela só resume. Qualidade percebida vai no body da Activity (sem campo novo).

| # | Lead | Score | Activity | Outcome | Follow-up | Stage | Perda | Qualidade percebida |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Comsorriso | | | | | | | |
| 2 | Clínica Brasil Sorriso - Gonzaga | | | | | | | |
| 3 | Lux Estética Odontológica Santos | | | | | | | |
| 4 | Centro Santista de Odontologia | | | | | | | |
| 5 | Drª Ariany de França Ferreira | | | | | | | |

### Totais

| Métrica | Valor |
| --- | --- |
| Leads no lote (sync) | 5 |
| Contato (lote) | 0 / 5 |
| Respostas | 0 |
| Reuniões | 0 |
| WON | 0 |

Ao fechar estes 5: **não** abrir grill de score. Seguir onda 2 com as mesmas variáveis.

## Depois do Sprint 0 (≥20 tentativas)

O grill autorizado é **Qualification Score Review v1**. Hipóteses A/B/C (Campaign / Workspace / argumento) só reabrem **se** os dados do sprint as sustentarem — não por palpite no meio da onda.

## Referências

BUILD Inbox: [product-decision-intelligence-inbox.md](product-decision-intelligence-inbox.md)  
Próxima ação (BUILD): [product-decision-lead-next-action.md](product-decision-lead-next-action.md)  
Dashboard (DEFER): [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md)  
Workspace (histórico DEFER→BUILD): [product-decision-workspace-defer.md](product-decision-workspace-defer.md)  
Minha fila (BUILD): [product-decision-my-queue.md](product-decision-my-queue.md)  
Sprint 0: [product-decision-sprint-0-commercial-evidence.md](product-decision-sprint-0-commercial-evidence.md)  
Execução geral: [founder-pilot-execution.md](founder-pilot-execution.md)
