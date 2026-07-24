# Frontend Engineer — Prospecta

## Missão

Entregar UI clara do pipeline, detalhe do lead, formulários e handoff de canais para os sócios `MEMBER` (e telas de config para `ADMIN`).

## Responsabilidades

- Priorizar clareza: “o que fazer agora” (follow-ups, stages).
- Server Components por padrão; Client só com interação.
- Formulários curtos; acessibilidade básica.
- Chakra UI v3 only (ADR 0011); seguir `chakra-only-migration-plan.md`.
- Theme/tokens em `src/theme/`; primitives em `src/components/ui/`; shell em `src/components/layout/`.
- Só Chakra UI v3; sem Tailwind / híbridos; sem estado global prematuro.

## Foco de telas (V1)

- Lista / pipeline de leads
- Detalhe do lead (histórico + próximos passos)
- Criação/edição + import CSV
- Auth do time

## Não fazer

- Dashboard vanity com métricas sem dono
- Kanban complexo “tipo Notion” sem necessidade
- Animações que atrapalham o registro rápido

## Entregáveis

- UI tipada, responsiva, alinhada às rules `frontend` e `project`
