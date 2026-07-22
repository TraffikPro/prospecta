# `.cursor` — operação do Prospecta

Documentação operacional para agentes e humanos no Cursor. Orienta **como** construir a plataforma interna de prospecção B2B, sem substituir o código nem o produto.

## Propósito

- Alinhar escopo MVP e decisões da V1
- Reduzir overengineering e PRs gigantes
- Reutilizar papéis (agents), regras (rules), skills, fluxos (workflows) e prompts (commands)
- Exigir problema, evidência, hipótese e métrica antes de features relevantes

## Fonte da verdade

| Fonte | Uso |
| --- | --- |
| `docs/product.md` | Problema, personas, fluxo, fora de escopo |
| `docs/product/pilot-validation-plan.md` | Validação do piloto founder-led |
| `docs/product/product-decision-mvp-technical.md` | Grill BUILD do MVP técnico |
| `docs/founding/roles-and-governance.md` | Sociedade (`PARTNER`) vs roles (`ADMIN`/`MEMBER`) |
| `docs/development/mcp-setup.md` | Context7, GitHub, Playwright, Figma |
| `README.md` | Setup, scripts, roadmap |
| `.env.example` | Variáveis de ambiente |
| `.cursor/rules/` | Convenções obrigatórias / contextuais |
| `.cursor/skills/` | Gates de produto (grill, design, qualidade de lead) |
| `.cursor/AGENTS.md` | Índice de papéis lógicos |
| Código em `src/` e `prisma/` | Implementação real |

Se houver conflito: **produto/docs > rules > preferência do agente**.

## Como usar

### Rules (`.cursor/rules/`)

Regras `.mdc` com frontmatter. As com `alwaysApply: true` valem em toda sessão. As demais entram por contexto (frontend, backend, banco, etc.).

### Agents (`.cursor/agents/`)

Papéis lógicos para planejar, implementar ou revisar. Não são automações mágicas: escolha o papel (ou peça para “atuar como X”) conforme a tarefa.

### Skills (`.cursor/skills/`)

| Skill | Uso |
| --- | --- |
| `product-grill` | Gate BUILD / VALIDATE / REDUCE SCOPE / DEFER / REJECT antes de planejar |
| `revenue-centric-design` | Hipótese + métrica para mudanças de UI/UX/operação (somente após BUILD) |
| `prospect-quality` | Qualidade de lista/lead, dedupe leve, campos mínimos, anti-lixo no CSV |

Nenhuma feature relevante deve começar sem `product-grill`.
`REDUCE SCOPE` → cortar → re-grill → só seguir com **BUILD**.
Registrar decisão em `## Product Decision` (plano + corpo da PR).
Ver `workflows/feature-development.md`.

### Workflows (`.cursor/workflows/`)

Sequências recomendadas: feature, bugfix, release, checagem de produção.

### Commands (`.cursor/commands/`)

Prompts reutilizáveis. Cole no chat ou referencie o arquivo ao pedir uma tarefa.
`plan-feature` exige product-grill antes de arquitetura.

### MCP

Exemplo compartilhável: `mcp.example.json`. Setup: `docs/development/mcp-setup.md`. Política: `rules/mcp-usage.mdc`.
Cópia local `.cursor/mcp.json` fica fora do git. Playwright MCP ≠ `@playwright/test`.

## PRs pequenas

1. Uma intenção por PR (feature, fix ou docs — não misturar)
2. Rodar `product-grill`; só planejar/codar se a decisão for BUILD
3. Planejar com `commands/plan-feature.md` e salvar `## Product Decision`
4. Validar (`lint`, `typecheck`, `build`) antes de commit
5. Reportar arquivos, escopo, hipótese/métrica; repetir resumo Product Decision na PR

## Evitar overengineering

- V1 = Next.js fullstack, CRM interno, WhatsApp por link, e-mail via `mailto`/template
- Sem LinkedIn automation, discador, sequências AI, multi-tenant SaaS, billing
- Preferir código direto em `features/`, `lib/`, `server/` a frameworks internos
- Não criar abstrações “para o futuro” sem uso imediato
- Cortar escopo com o olhar de Product Owner quando a feature crescer demais
