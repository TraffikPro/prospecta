# ADR 0009 — Google Places lead ingestion (Prospecta as source of truth)

- **Status:** proposed
- **Data:** 2026-07-23
- **Relacionado:** [0002-pipeline-lead-activity-v1.md](./0002-pipeline-lead-activity-v1.md), [0006-lead-foundation-v1.md](./0006-lead-foundation-v1.md), [0010-lead-intelligence-pipeline.md](./0010-lead-intelligence-pipeline.md), [../product/founder-pilot.md](../product/founder-pilot.md)
- **Product Decision:** VALIDATE (contrato/ADR agora; implementação de código **não** autorizada até BUILD explícito da fatia)

## Contexto

O piloto fundador congelou aquisição automática (Maps/scraper) para validar conversão com lista manual.

A nova tese repositiona o Prospecta:

```text
Google Places API
        ↓
prospecta-lead-generator  (sistema externo)
        ↓  lead qualificado + score
Prospecta CRM             (fonte da verdade)
        ↓
Activity / Pipeline / Venda
```

Antes: `API → CSV → humano → Prospecta`.  
Alvo: `API → Score → Prospecta` (CSV só export opcional).

Isso exige um **contrato de ingestão** no CRM (origem, idempotência, auth máquina-máquina) sem misturar Places API dentro do app Next.js do piloto.

## Decisão (arquitetura alvo)

1. **Prospecta** é a fonte central da verdade do lead e da operação comercial.
2. **prospecta-lead-generator** é sistema **externo** de aquisição (Places API + score + sync). Não é scraper; usa **Google Places API** (oficial).
3. Leads externos entram via **API interna** autenticada — não por formulário público.
4. Domínio do Lead ganha origem e identidade externa:
   - `source`: `MANUAL` | `GOOGLE_PLACES` | `REFERRAL` | `IMPORT` (enum V1; ver também ADR 0010)
   - `externalId`: string opcional (ex.: Google `place_id`); **obrigatório** quando `source = GOOGLE_PLACES`
   - unicidade: `@@unique([source, externalId])` quando `externalId` presente (idempotência de re-sync)
5. Endpoint alvo (nome pode ajustar na implementação):

   ```http
   POST /api/internal/leads
   Authorization: Bearer <PROSPECTA_IMPORT_TOKEN>
   ```

   Payload mínimo:

   ```json
   {
     "companyName": "Clínica Sorriso",
     "phone": "13999999999",
     "website": null,
     "source": "GOOGLE_PLACES",
     "externalId": "ChIJ...",
     "notes": "rating=4.8; reviews=320; reason=Sem website"
   }
   ```

   (`notes` permanece texto no V1; JSON estruturado de score pode evoluir depois sem bloquear.)

6. Comportamento de ingestão:
   - validar campos mínimos (iguais à criação manual: empresa + phone|email);
   - dedupe: `(source, externalId)` **e** regras atuais de email/phone;
   - criar com `stage = NEW`;
   - owner: regra a definir na fatia BUILD (ex.: default MEMBER comercial ou round-robin simples);
   - **sem** contato automático, sem WhatsApp, sem sequência.
7. Segurança: `PROSPECTA_IMPORT_TOKEN` só em env; rota interna rejeita sem Bearer válido; sem expor token no client.
8. Escopo **fora** desta decisão: campanhas nomeadas (V1.1), auditoria automática de site (V1.2), Kanban, dashboard, IA.

## Alternativas consideradas

| Alternativa | Por que não agora |
| --- | --- |
| Scraper Google Maps | ToS / fragilidade; rejeitado |
| CSV como caminho principal | Volta humano no meio; aceitável só como export/fallback |
| Places API dentro do monólito Next | Mistura aquisição com operação; dificulta custo/quota e deploy do piloto |
| Enrichment pago genérico | Fora V1; depende de evidência do piloto |

## Consequências

- Documenta a transição de “CRM alimentado manualmente” para “CRM como hub de aquisição + operação”.
- Reabre o **DEFER** de Places do [founder-pilot.md](../product/founder-pilot.md) **apenas como direção** — não autoriza código até:
  1. Deploy + smoke do piloto (Pilot Day 1 Ready), **e**
  2. Novo grill da fatia de implementação → **BUILD**.
- Ordem sugerida de implementação (quando BUILD):
  1. migration `source` + `externalId` + unique;
  2. `POST /api/internal/leads` + token;
  3. testes de dedupe/idempotência;
  4. conectar generator.
- Manual continua válido: `source = MANUAL`, `externalId` null.
- Custo Places API e quota ficam no generator, não no CRM.

## Escopo V1 vs futuro

| V1 (quando BUILD) | Depois |
| --- | --- |
| Places → score → sync CRM | Campanhas nomeadas |
| Dedupe `source`+`externalId` | Auditoria de site |
| Token Bearer interno | Enrichment / filas |
| Stage `NEW` sem auto-contato | Contato automático (só com evidência) |

## Hipótese (para o BUILD futuro)

Se leads qualificados entrarem direto no Prospecta com origem rastreável, o time reduz tempo de cadastro e aumenta volume de contatos sem perder a disciplina Activity/Pipeline — medido por leads `GOOGLE_PLACES` com ≥1 Activity em 7 dias e % sem duplicata.
