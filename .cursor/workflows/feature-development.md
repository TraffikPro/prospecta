# Workflow — Feature development

Use com Product Owner + Architect + Engineer(s) relevantes.

**Gate de produto:** nenhuma feature relevante começa sem `product-grill`.
Skills: `.cursor/skills/product-grill/SKILL.md` e, se houver UI/UX/operação,
`.cursor/skills/revenue-centric-design/SKILL.md`.
Import/lista: `.cursor/skills/prospect-quality/SKILL.md`.
Piloto: `docs/product/pilot-validation-plan.md`.

## 1. Entender objetivo e estágio

- Ler `docs/product.md`
- Qual problema do time fundador isso resolve (comercial, operações ou produto)?
- Afeta permissões `ADMIN`/`MEMBER`?
- Em qual fase do piloto estamos?

## 2. Classificar e grill

- Classificar PLATFORM / WORKSPACE / PILOT_SPECIFIC
- Executar **product-grill** (saída completa + artefato da decisão)
- Registrar a saída em `## Product Decision` no plano da feature

### Gate

| Decisão | Ação |
| --- | --- |
| **BUILD** | Seguir para hipótese/métrica e, se UI/UX/operação, revenue-centric-design |
| **VALIDATE** | Entregar experimento concreto; **parar** (sem arquitetura) |
| **REDUCE SCOPE** | Cortar escopo, reformular, **re-executar product-grill**; só seguir se BUILD |
| **DEFER** | Registrar condição/data; **parar** |
| **REJECT** | Registrar razão + evidência de reabertura; **parar** |

`REDUCE SCOPE` **nunca** autoriza arquitetura nem é BUILD implícito.

## 3. Hipótese e métrica (somente após BUILD)

- Hipótese em teste
- Comportamento esperado
- Métrica observável
- Menor mudança
- Validation owner + observation window

## 4. Design centrado em comportamento (se UI/UX/operação)

- Executar **revenue-centric-design** (consome o BUILD do grill)

## 5. Qualidade de prospecção (se captura/import)

- Executar **prospect-quality**

## 6. Arquitetura mínima

- Architect: arquivos, fronteiras server/client, schema se houver
- Preferir uma PR pequena

## 7. Implementar e validar

- Engineer(s) + testes do fluxo crítico
- `pnpm lint` / `typecheck` / `build`
- Relatório + `## Product Decision` na PR
