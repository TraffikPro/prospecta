# Founder Pilot Execution

Manual operacional dos sócios. Não é especificação de produto — é o **como executar** o piloto de 14 dias.

Tese e critérios estratégicos: [founder-pilot.md](founder-pilot.md).  
Validação técnica do app: [pilot-validation-plan.md](pilot-validation-plan.md).

**Regra de ouro:** Prospecta é a única fonte da verdade. Planilha só rascunha captura; depois disso, tudo vai para o app.

**Loop Lead Intelligence (pós-Inbox):**  
`/app/intelligence` → escolher prioridade → lead detail (pitch) → contato → Activity.  
Campanha lote 1: [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md).  
**Freeze:** sem features novas até evidência do primeiro lote de 5 contatos.

---

## 1. Objetivo do piloto

Validar se uma operação founder-led consegue gerar oportunidades comerciais para **venda de sites / redesign / presença online** usando o Prospecta como fonte única de verdade.

Pergunta que o piloto responde:

> Esse sistema ajuda a gerar receita?

Não:

> Conseguimos construir mais features?

---

## 2. Escolha do nicho

**Um nicho. 14 dias. ~50 empresas.**

Não escolher 5 nichos no mesmo piloto.

### Critérios

- fácil encontrar empresas (Maps / busca);
- ticket compatível com esforço de prospecção;
- dor digital evidente (sem site ou site fraco).

### Nicho do piloto (preencher antes do dia 1)

| Campo | Valor |
| --- | --- |
| Nicho escolhido | _ex.: Clínicas odontológicas_ |
| Hipótese | _ex.: Clínicas com presença digital fraca têm maior abertura para redesign/site novo_ |
| Região / cidade | _preencher_ |
| Data início | _AAAA-MM-DD_ |
| Data fim | _+14 dias_ |

Se o nicho não gerar respostas na 1ª semana, avaliar **troca no check-in semanal** — não misturar nichos no mesmo dia sem decisão explícita.

---

## 3. Papéis

| Papel | Sócio | Responsabilidade no piloto |
| --- | --- | --- |
| Aquisição + primeiro contato | Comercial | Encontrar, cadastrar, diagnosticar, abordar |
| Pipeline + follow-up | Operações | Próximo passo, atrasados, stages, disciplina |
| Produto + métricas | Gustavo | App estável, medir, registrar fricções (sem feature espontânea) |

---

## 4. Processo diário

### 4.1 Aquisição

| Item | Definição |
| --- | --- |
| Responsável | Sócio comercial |
| Meta | **5–10 empresas/dia** |
| Alvo janela | **~50 empresas** em 14 dias |

Por empresa, cadastrar no Prospecta:

- empresa (`companyName`);
- telefone **ou** e-mail;
- site (`website`) ou deixar claro “sem site” em `notes`;
- diagnóstico + oportunidade em `notes` (template abaixo);
- owner = quem vai operar o lead.

### 4.2 Qualificação (campo `notes`)

Copiar e preencher:

```text
Diagnóstico:
[ ] sem site
[ ] site antigo
[ ] site lento
[ ] sem CTA
[ ] baixa presença digital

Oportunidade: Alta | Média | Baixa
Oferta possível: Landing | Institucional | Redesign
Fonte: Maps manual | Indicação | Outro
```

### 4.3 Contato

**Toda tentativa vira Activity** (`WHATSAPP`, `EMAIL` ou `NOTE`).

Proibido:

```text
"mandei mensagem mas não registrei"
```

Depois de cada contato:

1. registrar Activity + outcome;
2. definir `nextFollowUpAt` se o lead continuar aberto;
3. mover stage quando fizer sentido (`CONTACTED`, `MEETING`, `WON`, `LOST`).

Clique no canal **não** conta como contato.

### 4.4 Checklist do dia (10 min)

Responder no fim do dia (chat interno / nota compartilhada):

1. Quantos leads novos?
2. Quantos contatos registrados?
3. Algum bloqueio? (dado faltando, app, roteiro, tempo)

---

## 5. Roteiro comercial

Objetivo do primeiro contato: **resposta → conversa → reunião**.  
Não vender o projeto no primeiro ping.

### 5.1 Primeiro contato (WhatsApp / e-mail)

> Olá, tudo bem? Encontrei a empresa de vocês e percebi que a presença digital poderia transmitir mais autoridade e gerar mais oportunidades. Vocês já possuem algum projeto de atualização do site?

### 5.2 Se responderem com interesse

> Perfeito — posso te mostrar em 15 min o que eu vi no site/presença de vocês e uma direção objetiva de melhoria? Qual horário funciona essa semana?

### 5.3 Se disserem que já têm alguém / não é prioridade

Registrar Activity (`NOT_INTERESTED` ou `OTHER`) + `lostReason` se for para `LOST`, **ou** follow-up futuro se fizer sentido. Não insistir no mesmo dia.

### 5.4 Cadência sugerida de follow-up

| Tentativa | Quando | Ação |
| --- | --- | --- |
| 1 | Dia do cadastro (ou D+0) | Primeiro contato |
| 2 | D+2 / D+3 | Follow-up curto (Activity) |
| 3 | D+7 | Último toque do ciclo ou `LOST` com motivo |

Ajustar no check-in semanal com base na resposta real do nicho.

---

## 6. Métricas

### 6.1 Operação (meta 14 dias)

| Métrica | Meta |
| --- | --- |
| Empresas cadastradas | ~50 |
| Leads com ≥1 Activity de contato | >70% |
| Leads abertos com próximo passo ou `WON`/`LOST` | >70% |

### 6.2 Comercial (medir; sem meta rígida de venda no dia 1)

| Métrica | Como contar |
| --- | --- |
| Contatos enviados | Activities `WHATSAPP` / `EMAIL` |
| Respostas | Outcomes `REPLIED` / `INTERESTED` |
| Reuniões | Stage `MEETING` e/ou `MEETING_SCHEDULED` |
| Propostas | Activity `NOTE` (“proposta enviada”) |
| Vendas | Stage `WON` + nota do que foi vendido |
| Perdas | `LOST` + `lostReason` |

### 6.3 Produto (só registrar)

- campo faltando;
- tela ruim;
- processo confuso;
- feature pedida.

**Não desenvolver durante o piloto** sem `product-grill` → **BUILD**.

---

## 7. Ritual dos sócios

### Diário — 10 min

- leads novos / contatos / bloqueios (checklist da seção 4.4).

### Semanal — 45 min

Perguntas obrigatórias:

1. O processo funcionou?
2. Onde perdemos leads?
3. O nicho respondeu? (se não, pivotar nicho ou oferta)
4. O Prospecta ajudou ou atrapalhou?
5. Alguma fricção repetida vira backlog (só lista — sem implementar)?

### Registro do check-in (copiar)

```text
Data:
Leads na semana:
Contatos:
Reuniões:
WON / LOST:
Bloqueios:
Aprendizados (diagnóstico → resposta):
Backlog candidato (sem BUILD):
```

---

## 8. Critérios pós-piloto

### Continuar operação

Se:

- houve reuniões (ou caminho claro até elas);
- pipeline foi usado de ponta a ponta;
- dados do lead foram suficientes para operar.

### Evoluir produto

Se:

- o mesmo gargalo apareceu **repetidamente** (ex.: importar lista, templates, filtro de atrasados).

Próximo passo: `product-grill` → só **BUILD** autoriza código.

### Pivotar oferta / nicho

Se:

- quase ninguém demonstra interesse;
- diagnóstico “certo” não gera conversa.

### Aquisição automatizada (Maps / API / CSV)

Continua **DEFER** até:

- houver venda ou reunião originada no fluxo;
- ICP/nicho vencedor estiver claro;
- coleta manual for o gargalo dominante.

Ver [founder-pilot.md](founder-pilot.md).

---

## 9. Antes do dia 1 (checklist)

Checklist completo e ordenado (deploy → usuários → backup → nicho → lista → script → ritual):

→ [pilot-day-1-checklist.md](pilot-day-1-checklist.md)

Resumo mínimo:

- [ ] Nicho, região e hipótese preenchidos (seção 2)
- [ ] Três sócios com login e papel certo (`ADMIN` / `MEMBER`)
- [ ] Deploy em produção smoke-testado
- [ ] Roteiro de primeiro contato alinhado (seção 5)
- [ ] Combinado: zero lead fora do Prospecta
- [ ] Data de início e fim definidas
- [ ] Canal do check-in diário/semanal definido

Quando [pilot-day-1-checklist.md](pilot-day-1-checklist.md) estiver completo → marco **Pilot Day 1 Ready**. Até lá, não abrir feature nova.
