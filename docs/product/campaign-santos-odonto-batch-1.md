# Campanha — Santos Odontologia (Lote 1)

**Status:** experimento comercial oficial — aguardando primeiro ciclo de Activity  
**Pergunta:** a inteligência gera conversa comercial real?

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

Próximo avanço = operação + aprendizado.

## Campanha

| Campo | Valor |
| --- | --- |
| Nicho | Odontologia |
| Região | Santos |
| Pool HIGH | ~18 (meta) |
| Lote inicial | **5** leads (maiores scores na Inbox) |
| Ferramenta | `/app/intelligence` → lead detail → Activity |
| Chave JSON | `santos-odontologia-2026-07` |

## Protocolo por lead

### Antes do contato

1. Abrir Intelligence Inbox → Lead Detail  
2. Ler diagnóstico + pitch  
3. Pergunta mental (30s): *“por que esta empresa é uma oportunidade?”*  
   Se não conseguir explicar, registrar na coluna Observação.

### Ordem de abordagem (não pular / não ampliar)

1. Comsorriso  
2. Clínica Brasil Sorriso - Gonzaga  
3. Lux Estética Odontológica Santos  
4. Centro Santista de Odontologia  
5. Drª Ariany de França Ferreira  

### Após cada contato (obrigatório)

```text
Lead → Activity → Outcome → Next Follow Up
```

| Situação | Type | Outcome | Follow-up |
| --- | --- | --- | --- |
| Sem resposta | WHATSAPP | SENT_NO_REPLY | +3 dias |
| Respondeu | WHATSAPP | REPLIED | next step no body |
| Reunião | WHATSAPP / NOTE | MEETING_SCHEDULED | data da reunião |

Sem Activity não há aprendizado.

### O que não fazer no lote

Não alterar score, pesos, sinais, pitch por lead, IA de mensagem, dashboard, website audit nem coletar novas cidades. Variável sob teste = Intelligence + oferta + abordagem atuais.

## Acompanhamento do lote (atualizar à mão)

| # | Lead | Contato | Resposta | Reunião | Observação qualitativa |
| --- | --- | --- | --- | --- | --- |
| 1 | Comsorriso | | | | |
| 2 | Clínica Brasil Sorriso - Gonzaga | | | | |
| 3 | Lux Estética Odontológica Santos | | | | |
| 4 | Centro Santista de Odontologia | | | | |
| 5 | Drª Ariany de França Ferreira | | | | |

### Totais

| Métrica | Valor |
| --- | --- |
| Leads no lote (sync) | 5 |
| Contato (lote) | 0 / 5 |
| Respostas | 0 |
| Reuniões | 0 |
| WON | 0 |

## Decisão após o lote (grill com números)

| Cenário | Leitura | Próximo passo |
| --- | --- | --- |
| Respostas altas + reunião | Máquina funciona | Escalar aquisição |
| 5 contatos / 0 respostas | Lead, mensagem, canal ou oferta | Investigar; hipótese C se argumento fraco |
| Respostas sem reunião | Posicionamento comercial | Ajustar oferta/pitch (não score às cegas) |
| Comercial não usa Inbox | Fricção de execução | Workspace — hipótese B |
| Mistura de campanhas | Atribuição | Campaign Foundation — hipótese A |

## Referências

BUILD Inbox: [product-decision-intelligence-inbox.md](product-decision-intelligence-inbox.md)  
Dashboard (DEFER): [product-decision-dashboard-defer.md](product-decision-dashboard-defer.md)  
Execução geral: [founder-pilot-execution.md](founder-pilot-execution.md)
