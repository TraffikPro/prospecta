# ADR 0006 — Lead Foundation V1

- **Status:** accepted
- **Data:** 2026-07-23
- **Product Decision:** [product-decision-mvp-technical.md](../product/product-decision-mvp-technical.md)

## Contexto

Com auth/ACL prontos, era necessário ativar a entidade central do produto (Lead)
sem construir CRM completo, pipeline visual ou atividades.

## Decisão

- Reutilizar model `Lead` + enum `LeadStage` do scaffold (sem migration de domínio)
- Camadas: repository → service → actions; UI mínima lista/criação/detalhe
- Create: `stage = NEW`, `ownerId =` usuário autenticado
- Dedupe centralizado: `findDuplicate({ emailNormalized, phoneNormalized })`
- Erro tipado `LeadDuplicateError` (`DUPLICATE_LEAD`)
- `ADMIN` e `MEMBER` veem/criam todos os leads (sem filtro por owner)
- Sem `segment` (fora dos opcionais V1 fechados)

## Fora desta fatia

Activity CRUD, Kanban, CSV, WhatsApp/mailto, dashboard, delete lead.

## Consequências

- Persistência e primeiro fluxo de negócio operáveis
- Próxima evolução natural: Activity + histórico de contato
