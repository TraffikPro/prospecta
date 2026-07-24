# Minha fila (operação) — Decision BUILD

- **Data:** 2026-07-24
- **Decisão:** **BUILD** (reduzido)
- **Classificação:** WORKSPACE
- **Histórico:** reabre [product-decision-workspace-defer.md](product-decision-workspace-defer.md)

## Product Decision

```text
DEFER Workspace
    → REOPENED (sintoma: operadores não sabem o próximo lead)
    → BUILD REDUCED: /app/my-leads
```

## Evidência

- Operadores relatam dificuldade para decidir o próximo lead.
- `/app/leads` mistura todos; Intelligence prioriza qualidade, não execução.
- `Próxima ação` existe no detail, mas não organiza a fila.

## Escopo autorizado

Rota `/app/my-leads` (“Minha operação”):

- Contagens: Sem contato · Follow-up hoje · Atrasados
- Lista por seções, leads do `ownerId` da sessão
- Card: empresa, score, ação derivada (`getNextAction`), Abrir → detail
- Ordenação: sem Activity → atrasados → hoje → demais; dentro: score desc

## Fora

- `/app/workspace` completo, Kanban, dashboard, automações, migration, mudança de score/Intelligence

## Hipótese

Fila operacional ↓ tempo até primeira Activity e ↑ % dos 5 leads com Activity.

## Métrica

Tempo até primeira Activity; % do lote Santos com Activity.
