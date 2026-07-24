# Product Decision — ADOPT CHAKRA UI ONLY

- **Data:** 2026-07-23 (reaberta)
- **Decisão:** **ADOPT CHAKRA UI ONLY**
- **Classificação:** PLATFORM
- **ADR:** [0011-ui-stack-keep-tailwind.md](../adr/0011-ui-stack-keep-tailwind.md)
- **Plano:** [chakra-only-migration-plan.md](./chakra-only-migration-plan.md)

## Problema

Dual stack (Chakra + Tailwind) cria inconsistência e dívida enquanto o Prospecta
vira plataforma operacional (Inbox + CRM + pipeline).

## Hipótese

Um único design system (Chakra v3) → telas mais rápidas e consistentes sem
bloquear o lote comercial (migração por fases, poucas telas).

## Decisão

```text
Decision:
ADOPT CHAKRA UI ONLY

Tailwind:
migrate until removed — not indefinite legacy.
```

## Escopo imediato (BUILD)

1. Atualizar ADR 0011  
2. Plano de migração  
3. Migrar **Login + Layout autenticado** (shell)  

## Fora agora

- Remoção do pacote Tailwind nesta fatia (só após zero usos)
- Dashboard / analytics
- Big-bang de todas as telas numa única PR

## Relação com o freeze comercial

O lote Santos Odontologia continua prioridade operacional. Migração de UI do
shell não bloqueia `/app/intelligence` nem Activity.
