# Dashboard v1 — Decision DEFER

- **Data:** 2026-07-24
- **Decisão:** **DEFER**
- **Classificação:** PLATFORM (quando reabrir)
- **Relacionado:** [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md)

## Status

**DEFERRED** — não autoriza arquitetura nem implementação.

## Motivo

O produto já tem infraestrutura para medir conversão (Lead → Activity → stage), mas ainda **não há volume de eventos comerciais reais**. Um painel agora mostraria zeros e não melhoraria a decisão além da tabela do lote Santos.

## Contexto atual

```text
Lead Intelligence ✅
Pipeline ✅
Activity ✅

Conversão:
em validação (lote Santos)
```

Estado típico no momento da decisão:

```text
Leads:        5
Activities:   0
Responses:    0
Meetings:     0
```

## Hipótese futura

Um painel operacional pode reduzir o tempo para responder:

- quantos leads foram trabalhados;
- taxa de resposta;
- reuniões geradas;
- campanhas vencedoras.

## Condições para reabrir o grill

Qualquer uma:

- 5 contatos concluídos no lote Santos; **ou**
- ≥3 Activities reais registradas; **ou**
- segunda campanha em execução; **ou**
- sócios sentem dificuldade real em acompanhar a operação

## Regra de produto

> Dashboard deve responder uma pergunta operacional **existente**, não criar uma pergunta nova.

| Evitar | Preferir |
| --- | --- |
| “Vamos fazer gráficos porque SaaS tem dashboard.” | “Temos duas campanhas e precisamos saber qual gera reuniões.” |

## Primeira versão esperada (quando BUILD)

Não começar com gráficos.

**Fatia 1:** KPIs numéricos — Leads, Contatados, Respostas, Reuniões, WON.

**Depois (só com uso comprovado):** gráficos, comparações, campanhas, tendências.

Fora da primeira fatia: BI completo, filtros complexos, previsão de receita, IA analítica, cohorts.

## Próximo passo agora

```text
Inbox → Contato → Activity → Resultado
```

Operar o lote Santos. O próximo grill (Dashboard / Workspace / Campaign / score) usa o gargalo real.

## Owner / revisão

- Owner: produto (Gustavo) + comercial
- Revisão: ao fechar o lote ou ao atingir condição de reabertura
