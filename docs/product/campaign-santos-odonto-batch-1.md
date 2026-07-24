# Campanha — Santos Odontologia (Lote 1)

**Status:** lote reingerido — operação comercial aberta (código congelado)  
**Pergunta:** a inteligência gera conversa comercial real?

## Estado pós-reset (2026-07-24)

| Item | Valor |
| --- | --- |
| Reset Neon | Leads/Activities zerados; Users preservados |
| Sync | `created=5 existing=0 failed=0` (`santos-odontologia-2026-07`) |
| Próximo | Contato real + Activity (sem alterar score) |

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

## Dia 1 — ritual do comercial

1. Abrir `/app/intelligence`
2. Filtrar **HIGH** (e origem Places se útil)
3. Escolher os **5** maiores scores
4. Abrir detalhe → usar pitch sugerido
5. Contatar (WhatsApp / e-mail)
6. Registrar **Activity** + próximo passo / outcome

### Activity mínima esperada

```text
Channel: WHATSAPP (ou EMAIL)
Outcome: SENT_NO_REPLY | REPLIED | INTERESTED | …
Next Follow Up: data combinada (se houver continuidade)
```

## Acompanhamento do lote (atualizar à mão)

| Lead | Contato | Resposta | Reunião | Resultado |
| --- | --- | --- | --- | --- |
| Comsorriso | | | | |
| Clínica Brasil Sorriso - Gonzaga | | | | |
| Lux Estética Odontológica Santos | | | | |
| Centro Santista de Odontologia | | | | |
| Drª Ariany de França Ferreira | | | | |

### Totais

| Métrica | Valor |
| --- | --- |
| Leads no lote (sync) | 5 |
| Contato (lote) | 0 / 5 |
| Respostas | 0 |
| Reuniões | 0 |
| WON | 0 |

## Decisão após o lote

| Resultado | Próximo passo |
| --- | --- |
| Muitas respostas | Escalar aquisição (mais cidades/nichos) |
| Poucas respostas / argumento fraco | Melhorar inteligência (audit site / pitch) — hipótese C |
| Comercial não usa a Inbox / fila confusa | UX operacional (Workspace) — hipótese B |
| Mistura de campanhas na operação | Campaign Foundation mínima — hipótese A |

## Referências

BUILD Inbox: [product-decision-intelligence-inbox.md](product-decision-intelligence-inbox.md)  
Execução geral: [founder-pilot-execution.md](founder-pilot-execution.md)
