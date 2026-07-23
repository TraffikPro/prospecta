# ADR 0010 — Lead Intelligence Pipeline

- **Status:** proposed
- **Data:** 2026-07-23
- **Relacionado:** [0009-google-places-lead-ingestion.md](./0009-google-places-lead-ingestion.md), [../product/founder-pilot.md](../product/founder-pilot.md)
- **Product Decision:** VALIDATE (direção e contrato; **não** BUILD de código até evidência do piloto + grill → BUILD)

## Contexto

O ADR 0009 define Prospecta como fonte da verdade e o generator como sistema externo de aquisição.

A visão evoluiu: não basta sincronizar nome/telefone/site. O vendedor precisa receber **oportunidade mastigada** — score, diagnóstico e argumento sugerido — e só então executar o contato humano.

```text
Google Places API
        ↓
Lead Generator
        ↓
Análise automática (Qualification Engine)
        ↓
Score + diagnóstico + pitch sugerido
        ↓
Prospecta CRM
        ↓
Sócio executa contato (Activity)
```

Regra de produto:

> Automatizar descoberta e análise; **manter humano no contato**.  
> Sem disparo automático de WhatsApp/e-mail nesta fase.

Isso acelera a operação comercial sem adiar a validação da oferta: o piloto ainda precisa provar resposta → reunião → venda.

## Decisão

### 1. Camadas do Lead Generator (sistema externo)

| Camada | Responsabilidade |
| --- | --- |
| Data Collector | Places API oficial (não scraper) |
| Qualification Engine | Score + diagnóstico + pitch sugerido |
| Sync | `POST` na API interna do Prospecta (ADR 0009) |

### 2. Contrato de saída para o Prospecta (além do 0009)

Campos de domínio alvo no CRM (quando BUILD):

| Campo | Tipo | Uso |
| --- | --- | --- |
| `source` | enum | `MANUAL` \| `GOOGLE_PLACES` \| `REFERRAL` \| `IMPORT` |
| `externalId` | string? | ex. Google `place_id`; obrigatório se `GOOGLE_PLACES` |
| `qualificationScore` | int? | 0–100 |
| `qualification` | enum? | `HIGH` \| `MEDIUM` \| `LOW` (opcional V1) |
| `externalMetadata` | JSON/texto | rating, reviews, maps URL, reasons, pitch |

V1 pode persistir diagnóstico em `notes` + metadata JSON se o schema ainda não tiver coluna dedicada — desde que a API aceite o payload estruturado.

### 3. Payload de ingestão enriquecido (alvo)

```json
{
  "companyName": "Clínica Sorriso Santos",
  "phone": "13999999999",
  "website": null,
  "source": "GOOGLE_PLACES",
  "externalId": "ChIJ...",
  "qualificationScore": 87,
  "qualification": "HIGH",
  "externalMetadata": {
    "rating": 4.8,
    "reviews": 340,
    "googleMapsUrl": "https://...",
    "reasons": [
      "Alta reputação local",
      "Sem presença web identificada"
    ],
    "suggestedApproach": "Empresa com boa reputação offline; oferecer presença digital profissional."
  },
  "notes": "Oportunidade alta — sem website; 4.8★ / 340 reviews"
}
```

### 4. Score V1 (simples, determinístico)

| Sinal | Pontos |
| --- | --- |
| Sem website | +50 |
| Rating ≥ 4.5 | +20 |
| Reviews > 100 | +20 |

Teto 100. Threshold sugerido para sync automático: score ≥ 70 (ajustável no generator, não no CRM).

Sem IA no V1 do score. IA de auditoria de site = fase posterior (ver abaixo).

### 5. Diagnóstico automático (V1)

Gerado pelo Qualification Engine a partir das regras acima — texto/JSON estruturado, não LLM obrigatório.

Exemplo de saída:

```json
{
  "score": 90,
  "qualification": "HIGH",
  "reasons": [
    "Alta reputação local",
    "Sem presença web identificada"
  ],
  "suggestedApproach": "Empresa com boa reputação offline mas oportunidade de fortalecer aquisição online"
}
```

### 6. O que o vendedor vê no Prospecta (UX alvo)

No detalhe do lead (quando BUILD + UI mínima):

- origem `GOOGLE_PLACES`;
- score;
- motivos (checklist);
- sugestão de abordagem;
- dados Google (rating, reviews, link Maps).

Sem dashboard de campanhas nesta fatia.

### 7. Segurança e limites

- Mesmo token `PROSPECTA_IMPORT_TOKEN` do ADR 0009.
- Sem contato automático.
- Sem scraper.
- Custo/quota Places fica no generator.

### 8. Fases de entrega (quando autorizadas)

| Fase | Entrega | Pré-condição |
| --- | --- | --- |
| 1 — agora | Este ADR + 0009 (contratos) | — |
| 2 | Prospecta ingestion API (`source`, `externalId`, metadata) | Day 1 Ready + grill **BUILD** |
| 3 | Lead Generator sync (Places → score → POST) | Fase 2 estável |
| 4 | IA / auditoria de website → argumento comercial | Evidência de conversão + custo justificado |

## Alternativas consideradas

| Alternativa | Decisão |
| --- | --- |
| Só CSV + diagnóstico manual | Válido no piloto Day 1; não escala aquisição |
| Score com IA desde o dia 1 | Prematuro; regras determinísticas primeiro |
| Auto-mensagem WhatsApp | Rejeitado nesta fase (humano no contato) |
| Intelligence dentro do monólito Next | Evitar; manter generator externo |

## Consequências

- Prospecta deixa de ser só CRM e passa a ser hub de **aquisição + qualificação + execução**.
- Vendedor recebe oportunidades prontas; não pesquisa Google no dia a dia.
- Piloto comercial **não é cancelado**: lista manual / primeiros contatos ainda validam oferta e roteiro.
- Automação é aceleração **depois** (ou em paralelo documentada), nunca desculpa para adiar a primeira reunião.
- Reabrir implementação quando:
  - **A)** vendeu/reuniu e cadastro manual é gargalo; ou
  - **B)** volume manual insuficiente; ou
  - **C)** um nicho converte e justifica campanhas Places.

## Hipótese (para BUILD futuro)

Se leads chegarem com score ≥ 70 e diagnóstico explícito, o tempo até primeiro contato cai e a taxa de resposta sobe vs. leads “crus” — medido por tempo médio NEW→primeira Activity e % de respostas em leads `GOOGLE_PLACES`.
