# Commercial Playbook — Prospecta

- **Data:** 2026-08-14
- **Status:** **VALIDATE** (execução comercial) — UI operacional no detalhe do lead; sem IA, auto-send, schema de cadência ou novos sinais
- **Classificação:** PILOT_SPECIFIC (ICP/oferta do time fundador) · WORKSPACE (como operar no CRM)
- **Owner ICP / abordagem:** Sócio Comercial
- **Owner disciplina no app:** Sócio de Operações
- **Este corte (V1):** `01 ICP` · `02 Oferta (mínimo)` · `03 Gatilhos` · `04 WhatsApp`
- **UI operacional:** disponível no Prospecta (Minha fila → lead → **Abordagem comercial**). Scripts estáticos em `src/features/commercial/playbook-v1.ts`. Este Markdown continua sendo a explicação da estratégia.
- **Critério de saída do V1:** usar a cadência em leads HIGH reais e registrar o que aconteceu (resposta, silêncio, objeção, encaminhamento, interesse, reunião) — não “ter os scripts escritos”
- **Próximo corte:** só depois desse uso real, escolhido pelo gargalo observado (e-mail / objeções / discovery). Sem roadmap antecipado de canal.

Motor técnico (F1–F4, KPIs, dashboard, badges) está **fechado**. Este documento não altera regra de assignment, score nem sinais.

---

## Índice

| # | Capítulo | Estado |
| --- | --- | --- |
| 01 | ICP | **V1** |
| 02 | Oferta | **V1 mínimo** (frase + o que não prometer) |
| 03 | Gatilhos de abordagem | **V1** |
| 04 | WhatsApp | **V1** (D0 → reativação + respostas) |
| 05 | LinkedIn | NEXT |
| 06 | E-mail | NEXT |
| 07 | Follow-ups (multicanal) | NEXT — cadência WhatsApp já está no 04 |
| 08 | Objeções | NEXT — respostas WhatsApp no 04 |
| 09 | Discovery | NEXT |
| 10 | Fechamento | NEXT |
| 11 | Outcomes no Prospecta | **V1 mínimo** (caixa no 04) |
| 12 | Métricas | **V1 mínimo** |

Tese do piloto: [founder-pilot.md](../product/founder-pilot.md)  
Lote oficial: [campaign-santos-odonto-batch-1.md](../product/campaign-santos-odonto-batch-1.md)  
Sinais canônicos no código: `NO_WEBSITE` · `HIGH_RATING` · `HIGH_REVIEWS`

---

## Princípio

Não existe um script único para qualquer empresa.

```text
Sinal observado
↓
Hipótese de problema
↓
Mensagem curta e específica
↓
Pergunta fácil de responder
↓
Conversa
↓
Qualificação
↓
Próximo passo
```

**Ruim:** “somos uma empresa especializada em soluções digitais e gostaríamos de apresentar nossos serviços.”

**Bom:** pergunta sobre um problema que o sinal torna plausível — sem vender o produto no primeiro ping.

O pitch gerado no Lead Detail é **insumo**, não texto obrigatório. Se em 30 segundos você não explica por que *esta* clínica é oportunidade, não envie: anote e siga.

---

## 01. ICP

A plataforma continua B2B genérica. O **piloto** escolhe um nicho por vez. Dono fino do ICP = Sócio Comercial. Este V1 documenta o recorte **já oficial do lote**, sem inventar um segundo nicho.

### Recorte ativo (lote 1)

| Campo | Valor | Fonte |
| --- | --- | --- |
| Nicho | Odontologia | Campanha Santos |
| Região | Santos | Campanha Santos |
| Qualificação de lista | `HIGH` na Intelligence Inbox / carteira semanal | Score ≥ 70 ou `qualification: HIGH` |
| Oferta do time | Presença digital (site / site-conceito / contato claro) | Piloto + catálogo `/app/portfolio` |
| Canal desta fatia | WhatsApp humano (`wa.me`) | Produto V1 |

### Quem vale abordar agora

Aborde se **todas** forem verdade:

1. Nicho odontologia (clínica, consultório, especialidade odontológica).
2. Há telefone no lead (WhatsApp precisa de número).
3. Intelligence é **HIGH** — ou o sócio comercial marcou explicitamente como prioridade.
4. Você consegue completar, em voz alta: *“o sinal X sugere o problema Y”*.
5. Lead não está `WON` / `LOST` / `MEETING` já agendada.

### Quem não abordar neste corte

- `LOW` / `MEDIUM` enquanto houver HIGH na fila.
- Sem telefone (use e-mail só no capítulo 06 — ainda NEXT).
- Lead que você não consegue explicar em 30s.
- `WON` / `LOST` (reativação = capítulo futuro; não improvise recycle).
- Empresa fora de odontologia “porque o Maps trouxe”.

### Decisor provável

Hipótese operacional — **não** é um campo do CRM:

| Tipo | Decisor típico | Como tratar no WhatsApp |
| --- | --- | --- |
| Consultório individual | O próprio profissional | Primeira pessoa; pergunta simples |
| Clínica com equipe | Dono / responsável pela recepção ou marketing | Perguntar quem cuida da presença / agenda |
| Grupo / rede | Sócio ou quem manda no comercial | Se “fala com fulano”, peça o contato e registre `WRONG_CONTACT` ou `REPLIED` + nota |

Não afirme o cargo. Pergunte.

### Problema que estamos explorando

Paciente pesquisa e compara **antes** de marcar. Clínica com demanda visível (nota/volume no Google) e presença digital fraca ou ausente perde conversa, confiança e horário.

Não diagnosticamos o site automaticamente (Website Intelligence continua fora). Só falamos do que o Prospecta **já mostrou**: sinais + diagnóstico + o que você viu no Google/lead.

### Fora do ICP deste V1

Imobiliárias, escritórios, industriais, restaurantes — candidatos históricos do piloto, **não** deste corte. Um nicho por vez.

---

## 02. Oferta (mínimo para abordar)

### Uma frase

Ajudamos clínicas odontológicas a ter uma presença digital clara — para o paciente que já pesquisou no Google conseguir entender o consultório e chamar no WhatsApp sem fricção.

### O que podemos mostrar

Modelos **demonstrativos** em `/app/portfolio` (Odontologia):

| Modelo | Quando faz sentido na conversa |
| --- | --- |
| Dr. Consultório | Profissional individual, presença enxuta |
| Clínica Sorriso | Clínica que precisa apresentar tratamentos e facilitar o 1º contato |
| Atelier Dental | Estética / diferenciação visual (conceito — não case) |

Disclaimer obrigatório (produto): modelos / sites-conceito — **não** são cases de cliente.

### O que não prometer

- Posição no Google, volume de pacientes ou faturamento.
- “Já fizemos o site da clínica X” (não há case no catálogo).
- WhatsApp Business API, chatbot, CRM do paciente, convênio, software clínico.
- Auditoria técnica do site atual (não existe essa camada no Prospecta).
- Preço no primeiro ping, salvo o prospect perguntar — e aí ainda não invente tabela.

Versão 30 segundos, benefícios longos e fechamento → capítulos 09–10 (NEXT).

---

## 03. Gatilhos de abordagem

Sinais canônicos (UI em português; código entre parênteses):

| Sinal na tela | Código | O que observa | Hipótese (não é fato) |
| --- | --- | --- | --- |
| Website não identificado | `NO_WEBSITE` | Não há site confiável na ficha | Paciente acha a clínica no Google e não tem um lugar claro para entender o consultório |
| Alta reputação no Google | `HIGH_RATING` | Nota alta | Já existe confiança social; a presença pode não estar à altura da reputação |
| Volume relevante de avaliações | `HIGH_REVIEWS` | Muita gente avalia | Há demanda; o gargalo pode ser captura / próximo passo depois do Google |

Use **combinações**, não um texto médio.

| Prioridade | Combinação | Hipótese | Oferta a ter na manga | Não diga |
| --- | --- | --- | --- | --- |
| 1 | `NO_WEBSITE` + `HIGH_RATING` + `HIGH_REVIEWS` | Demanda e reputação sem “casa” digital | Presença enxuta + WhatsApp/localização | “Vocês não têm site então o negócio vai mal” |
| 2 | `NO_WEBSITE` + `HIGH_RATING` | Reputação sem destino | Dr. Consultório / Clínica Sorriso | “Site resolve agenda sozinho” |
| 3 | `NO_WEBSITE` + `HIGH_REVIEWS` | Volume sem presença própria | Presença + contato claro | Inventar que o atendimento é caótico |
| 4 | `NO_WEBSITE` só | Ausência de site | Presença mínima | Inventar reputação que o lead não tem |
| 5 | `HIGH_RATING` + `HIGH_REVIEWS` **sem** `NO_WEBSITE` | Demanda existe; **não** sabemos se o site é ruim | Perguntar como o paciente chega hoje | “Vi que o site de vocês está ultrapassado” |

Se o diagnóstico/pitch do lead nomear um detalhe específico (bairro, especialidade, “só WhatsApp”), **use esse detalhe**. Não invente “pedidos pelo WhatsApp” se o Prospecta não mostrou isso.

### Ordem na fila

1. HIGH da Minha fila / Inbox, combinação 1 → 5.
2. Pendentes da semana (`pending` da carteira) antes de caçar lead novo.
3. Sem pular a ordem do lote Santos enquanto aquele experimento estiver aberto.

---

## 04. WhatsApp

Objetivo do ciclo: **resposta → conversa → reunião de 15 min**.  
Não vender o projeto no D0.

Antes de enviar:

1. Abrir o lead no Prospecta.
2. Ler sinais + diagnóstico.
3. Completar a frase: sinal → hipótese.
4. Personalizar `[nome]` `[clínica]` `[cidade/bairro se souber]`.
5. Enviar no `wa.me`.
6. **Registrar Activity** — clique não conta.

### Sequência

| Passo | Quando | Se | Outcome | Follow-up no app |
| --- | --- | --- | --- | --- |
| D0 | Primeiro toque | Enviou | `SENT_NO_REPLY` | D+2 |
| D+2 | Sem resposta | Enviou de novo | `SENT_NO_REPLY` | D+5 |
| D+5 | Sem resposta | Toque curto | `SENT_NO_REPLY` | D+9 |
| D+9 | Sem resposta | Última tentativa do ciclo | `SENT_NO_REPLY` | +30–45 dias (reativação) **ou** `LOST` + motivo se o comercial encerrar |
| Reativação | Após silêncio do ciclo | Nova hipótese, sem copiar D0 | `SENT_NO_REPLY` / `OTHER` | Novo ciclo |

Se responderem em qualquer dia: **pare a sequência** e use o bloco “Respostas” abaixo.

Lote Santos documentava follow-up +3 dias. **Este playbook passa a ser a cadência comercial.** Ajuste `nextFollowUpAt` para a data da tabela.

### D0 — primeira abordagem

Estrutura: cumprimento curto + 1 fato do sinal + 1 pergunta de sim/não ou escolha.

**A. Sem site + reputação e/ou volume**

> Oi, [nome]. Vi a [clínica] no Google em [Santos] — nota e avaliações boas, mas não encontrei um site claro da clínica. Hoje o paciente que pesquisa vocês consegue entender os tratamentos e chamar no WhatsApp sem ficar só no perfil do Maps?

**B. Só sem site**

> Oi, [nome]. Encontrei a [clínica] e não identifiquei um site próprio. Quando alguém pesquisa o nome de vocês, o próximo passo fica no Google/WhatsApp mesmo, ou vocês já têm alguma página de referência?

**C. Reputação + volume, com site na ficha (não ataque o site)**

> Oi, [nome]. Vi que a [clínica] tem bastante avaliação no Google. Queria entender: hoje a maior parte dos pacientes novos chega pelo Maps, indicação ou algum site/página de vocês?

**D. Há diagnóstico específico no lead**

Substitua a frase do meio pelo fato do diagnóstico. Mantenha **uma** pergunta.

Não use o roteiro antigo (“presença digital poderia transmitir mais autoridade… projeto de atualização do site?”) — é genérico e vende no primeiro ping.

### D+2

> Oi, [nome]. Só para não perder o contexto: a dúvida era se o paciente que acha a [clínica] no Google tem um próximo passo claro além do perfil. Faz sentido conversar 10 min sobre isso ou agora não é o momento?

### D+5

> [nome], último recado desta semana: se a agenda de novos pacientes já está resolvida, eu encerro por aqui. Se quiser, te mostro em 15 min um site-conceito de odontologia (modelo, não case) só para comparar o próximo passo depois do Google.

### D+9 — última do ciclo

> Oi, [nome]. Não vou insistir. Se no futuro quiserem olhar presença digital da [clínica] com calma, fico à disposição. Bom atendimento aí.

### Reativação (30–45 dias)

Nova abertura com **outro** ângulo (ex.: volume de avaliações se D0 foi só “sem site”). Não reenvie o D0.

---

### Respostas (WhatsApp)

| O que o prospect diz / faz | Você | Type | Outcome | Stage / próximo |
| --- | --- | --- | --- | --- |
| Interessado / “pode ser” | Peça 15 min e 2 horários | `WHATSAPP` | `INTERESTED` | Follow-up = data combinada; se marcar → `MEETING_SCHEDULED` + stage `MEETING` |
| “Me manda mais informações” | 3 bullets + pergunta de horário; pode mandar **um** link de modelo do portfólio com o disclaimer | `WHATSAPP` | `REPLIED` ou `INTERESTED` | Follow-up D+1 se não escolher horário |
| “Quanto custa?” | Não chute tabela. “Depende do que a clínica precisa; em 15 min eu te mostro o recorte e a faixa.” | `WHATSAPP` | `REPLIED` / `INTERESTED` | Agendar discovery |
| “Já tenho fornecedor / já tenho site” | “Perfeito. Vocês estão satisfeitos com o próximo passo do paciente depois do Google, ou é mais inércia?” | `WHATSAPP` | `REPLIED` | Se fechar porta → `NOT_INTERESTED`; senão follow-up |
| “Não tenho interesse” | Agradeça; não discuta | `WHATSAPP` | `NOT_INTERESTED` | `LOST` + `lostReason` **ou** reativação longa se o comercial quiser manter |
| “Fala com fulano” | Peça nome, cargo, WhatsApp | `WHATSAPP` | `WRONG_CONTACT` se número errado; senão `REPLIED` + nota | Atualize contato; não trate como reunião |
| Visualizou / silêncio | Não cobre no mesmo dia | — | já deve estar `SENT_NO_REPLY` | Siga D+2 / D+5 / D+9 |
| “Agora não” | “Melhor em qual mês?” | `WHATSAPP` | `REPLIED` ou `OTHER` | `nextFollowUpAt` na data que a pessoa der; **não** `LOST` automático |

### Mini-qualificação (só depois que houver conversa)

Uma pergunta por vez:

1. Como o paciente novo chega hoje?
2. Quem decide site / presença / marketing?
3. Isso é incômodo agora ou só “um dia”?
4. Já tentaram resolver? O que travou?

Autoridade e orçamento **não** cabem no D0.

---

### Registro no Prospecta (mínimo)

```text
Clique no WhatsApp  ≠  contato
Activity persistida  =  verdade
```

| Situação | Outcome | Follow-up | Tratado da carteira |
| --- | --- | --- | --- |
| Enviou, ninguém respondeu | `SENT_NO_REPLY` | Sim (tabela da sequência) | Sim, se for WhatsApp/e-mail **com outcome** no assignment ativo (regra F1) |
| Respondeu | `REPLIED` | Se ainda não há reunião | Idem |
| Quer avançar | `INTERESTED` | Horário da conversa | Idem |
| Reunião marcada | `MEETING_SCHEDULED` | Data da reunião | Idem |
| Sem interesse | `NOT_INTERESTED` | Não obrigatório | Idem; `LOST` é decisão comercial, não automática |
| Número / pessoa errada | `WRONG_CONTACT` | Não, a menos que tenha outro contato | Idem |

Não use `NOTE` para “marcar tratado”.  
Não recicle HIGH você mesmo: recycle é **ADMIN** na Revisão HIGH.  
Não complete carteira pelo playbook: isso é F3 na Minha fila.

### UI operacional no Prospecta

**Operational UI available in Prospecta** — seção **Abordagem comercial** no detalhe do lead (entrada: Minha fila).

```text
Lead autorizado
↓
sinais canônicos existentes
↓
template estático aprovado
↓
operador copia / abre WhatsApp
↓
registra Activity
```

Copiar mensagem e abrir WhatsApp **não** criam Activity, **não** marcam TREATED e **não** avançam cadência.

Decisão: [product-decision-commercial-playbook-ui.md](../product/product-decision-commercial-playbook-ui.md).  
Runtime: `src/features/commercial/playbook-v1.ts` (não gerar copy em runtime).

---

## 05–10. NEXT (não decidir agora)

O próximo capítulo **não** é um roadmap de canais. Só abre depois do uso real do WhatsApp nos HIGH:

| Gargalo observado | Próximo corte |
| --- | --- |
| “Me manda por e-mail” | 06 E-mail |
| Recusas repetidas | 08 Objeções |
| Reuniões marcadas | 09 Discovery |
| Outro | Grill comercial — não inventar canal |

---

## 11. Outcomes — índice rápido

Ver caixa no capítulo 04. Contratos de produto: [product.md](../product.md) (Activity) · carteira semanal F1–F2.

---

## 12. Métricas (mínimo)

Contar no Prospecta, sem planilha paralela como verdade:

| Pergunta | Onde |
| --- | --- |
| Abordados | Activities `WHATSAPP` |
| Sem resposta | `SENT_NO_REPLY` |
| Respostas | `REPLIED` / `INTERESTED` |
| Reuniões | `MEETING_SCHEDULED` e/ou stage `MEETING` |
| Vendas | `WON` + nota do que foi vendido |
| Perdas | `LOST` + `lostReason` |
| Execução da semana | Dashboard `/app` (pending / tratados) — **não** substitui conversa |

Proposta ainda não tem campo próprio: `NOTE` “proposta enviada” até existir evidência para produto.

Meta de disciplina do piloto permanece: ≥70% dos leads abertos com próximo passo ou `WON`/`LOST`.

---

## Grill (por que VALIDATE, não BUILD)

| Campo | Valor |
| --- | --- |
| Problema | O time tem HIGH no Prospecta e um roteiro genérico que não usa os sinais |
| Evidência | `founder-pilot-execution.md` §5.1 é pitch de “soluções digitais”; lote Santos com 0 Activity |
| Hipótese | Abordagem sinal → pergunta aumenta resposta real no WhatsApp |
| Métrica | Activities + `REPLIED`/`INTERESTED`/`MEETING_SCHEDULED` no lote |
| Menor corte | Este documento + uso nos HIGH atuais |
| Não fazer | IA de mensagem, sequência automática, novos sinais, Website Intelligence |

Se o comercial pedir mudança de score/sinais/pitch gerado **depois** de usar este playbook, aí sim abre product-grill de produto.
