# Piloto fundador — Prospecta

Documento da **tese e critérios** do piloto comercial após o MVP técnico (Auth → Lead → Activity → Pipeline).

Manual do dia a dia dos sócios: [founder-pilot-execution.md](founder-pilot-execution.md).  
Validação técnica do app: [pilot-validation-plan.md](pilot-validation-plan.md).

## Posicionamento do piloto

```text
Aquisição de demanda
(Google Maps / pesquisa manual / indicações)
              ↓
Lista de empresas-alvo
              ↓
Prospecta (operação comercial)
              ↓
Venda de solução digital
(site, redesign, presença online)
```

| Camada | Papel | Status no piloto |
| --- | --- | --- |
| Aquisição | Encontrar empresas por nicho | **Manual** (DEFER automação Maps) |
| Prospecta | Transformar lista em receita | **Em uso** (fonte da verdade) |
| Oferta | Site / redesign / presença | **PILOT_SPECIFIC** (negócio do time) |

O Prospecta **não** é um raspador de empresas. É o sistema operacional da prospecção B2B de serviços digitais.

## Objetivo

Validar se o time fundador consegue **vender soluções digitais** (site, redesign, presença online) operando o fluxo completo no Prospecta — sem planilha paralela como fonte da verdade.

## Duração

**14 dias** a partir do dia em que os três sócios passam a operar leads reais no app.

## Hipótese comercial

Se o time montar uma lista focada (nicho + diagnóstico de presença digital) e operar só no Prospecta, consegue registrar pelo menos **1 reunião (`MEETING`) ou 1 ganho (`WON`)** na janela — e manter ≥70% dos leads abertos com próximo passo ou stage terminal.

Hipótese de produto (uso): ver [pilot-validation-plan.md](pilot-validation-plan.md).

## Regras do piloto

1. **Nenhum lead fora do Prospecta** — planilha só como rascunho de captura; a verdade operacional fica no app.
2. **Toda interação vira Activity** — clique em WhatsApp/e-mail não conta; só atividade persistida.
3. **Todo lead termina com próximo passo ou terminal** — `nextFollowUpAt` futuro **ou** `WON` / `LOST` (com `lostReason`).
4. **Sem feature nova durante a janela** — fricção vira nota no check-in; mudança de produto só com novo `product-grill` → **BUILD**.
5. **Aquisição manual** — Google Maps / pesquisa / indicação; sem scraper e sem Places API nesta fase.

## Qualificação comercial (sem alterar código)

Usar campos já existentes (`website`, `notes`) no cadastro/detalhe do lead.

### Template sugerido em `notes`

```text
Diagnóstico: Sem site | Site antigo | Site lento | Sem CTA | Boa presença
Oferta: Landing page | Site institucional | Redesign
Nicho: <ex.: clínicas odontológicas>
Fonte: Maps manual | Indicação | Outro
```

Preencher `website` quando houver URL (mesmo que o site seja ruim).

Objetivo do aprendizado: descobrir **qual problema gera mais reunião/venda**.

## ICP inicial do piloto (foco de oferta)

A plataforma permanece genérica B2B; o **piloto comercial** escolhe um nicho por vez.

Critérios de nicho: ticket suficiente, confiança importante, presença digital relevante.

| Nicho candidato | Problema típico a explorar |
| --- | --- |
| Clínicas | Paciente pesquisa antes de marcar |
| Escritórios | Autoridade digital |
| Industriais pequenas | Site antigo passa pouca confiança |
| Imobiliárias | Captar leads |

**Semana 1 sugerida:** um nicho só (ex.: clínicas odontológicas), ~30–50 empresas classificadas e cadastradas.

### Classificação mínima na captura (antes/durante o cadastro)

| Campo | Exemplo |
| --- | --- |
| Empresa | Clínica XPTO |
| Telefone / e-mail | Contato mínimo |
| Site | URL ou “sem site” |
| Problema encontrado | Sem site / site antigo / … |
| Oferta possível | Landing / institucional / redesign |

## Métricas

### Operação

| Métrica | Como observar |
| --- | --- |
| Leads cadastrados | Contagem no app |
| Contatos realizados | Activities `WHATSAPP` / `EMAIL` |
| Atividades por lead | Timeline do lead |
| Leads parados | Sem follow-up útil / atraso (definição em [pilot-validation-plan.md](pilot-validation-plan.md)) |

### Comercial

| Métrica | Como observar |
| --- | --- |
| Reuniões | Stage `MEETING` e/ou outcome `MEETING_SCHEDULED` |
| Propostas | Nota/activity (manual no piloto) |
| Vendas | Stage `WON` (+ nota do que foi vendido) |
| Motivos de perda | `lostReason` em `LOST` |

### Produto

| Sinal | Onde registrar |
| --- | --- |
| Campos faltantes | Check-in semanal |
| Telas confusas | Check-in semanal |
| Ações repetitivas | Check-in semanal |

Meta de disciplina (produto): ≥70% dos leads abertos com próximo passo ou `WON`/`LOST`.

## Ritual

| Item | Definição |
| --- | --- |
| Check-in | 15 min / semana (3 sócios) |
| Owner ICP / oferta | Sócio Comercial |
| Owner pipeline / usabilidade | Sócio de Operações |
| Owner métricas / produto | Gustavo |

## Decisões de aquisição

| Tema | Decisão | Notas |
| --- | --- | --- |
| Scraper Google Maps | **REJECT** | ToS / fragilidade |
| Google Places → lead-generator → CRM | **VALIDATE** (direção) | Contratos [ADR 0009](../adr/0009-google-places-lead-ingestion.md) + inteligência [ADR 0010](../adr/0010-lead-intelligence-pipeline.md); **sem código** até evidência + grill → **BUILD** |
| Contato automático (WhatsApp/e-mail em massa) | **REJECT** nesta fase | Humano executa Activity; automação só na descoberta/análise |
| CSV como caminho principal | Fallback / export | Não é o alvo do sync |
| Enrichment pago genérico | Fora até evidência | — |

Piloto Day 1 continua com **aquisição manual**. A direção Places não bloqueia nem substitui o piloto.

## Critérios de sucesso do piloto

| Critério | Sucesso |
| --- | --- |
| Disciplina operacional | ≥70% leads abertos com próximo passo ou terminal |
| Sinal comercial | ≥1 `MEETING` ou `WON` no app |
| Fonte da verdade | Sem planilha paralela como sistema principal |
| Aprendizado de oferta | Pelo menos um padrão claro em diagnóstico → reunião/venda ou perda |

## Stop / ajuste

Iguais ao plano técnico: [pilot-validation-plan.md](pilot-validation-plan.md) (perda de dados, fricção maior que planilha, PII, impasse societário).

Campo ou fluxo pedido repetidamente → novo `product-grill` (não implementar no meio da janela sem **BUILD**).

## Pós-piloto (só com evidência)

Possíveis fatias — **não** autorizadas agora:

1. Dashboard operacional  
2. Filtros e busca  
3. Importação CSV  
4. Templates de contato / handoff `wa.me` + `mailto`  
5. Integrações oficiais  
6. IA para priorização  

Qualquer item exige `product-grill` → **BUILD**.
