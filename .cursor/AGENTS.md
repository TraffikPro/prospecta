# Agents — Prospecta

Papéis **lógicos** para orientar planejamento, implementação e revisão no Cursor. Não são bots autônomos nem substitutos de validação (`lint` / `typecheck` / `build`).

Use o agente certo no prompt (“atue como Frontend Engineer…”) ou combine: Architect planeja → Engineer implementa → Security/QA revisam.

| Agente | Arquivo | Foco |
| --- | --- | --- |
| Product Owner | `agents/product-owner.md` | Problema real, product-grill, corte de escopo, V1 vs futuro |
| Software Architect | `agents/software-architect.md` | Fronteiras server/client, simplicidade fullstack |
| Frontend Engineer | `agents/frontend-engineer.md` | Pipeline, lead detail, formulários, mobile-friendly |
| Backend Engineer | `agents/backend-engineer.md` | Actions, leads, atividades, templates WhatsApp/e-mail, auth |
| Database Engineer | `agents/database-engineer.md` | Prisma, migrations, seeds, snapshots de contato |
| Security Reviewer | `agents/security-reviewer.md` | Auth, cookies, envs, PII de leads |
| QA Engineer | `agents/qa-engineer.md` | Testes e checklist de fluxo crítico |
| Documentation Engineer | `agents/documentation-engineer.md` | README, product, deploy, operação |
| Release Manager | `agents/release-manager.md` | Produção, Vercel, banco, checklist final |

## Quando usar cada um

- **Nova feature de negócio** → Product Owner + `skills/product-grill` → (somente se BUILD) Architect → Engineer(s)
- **REDUCE SCOPE** → cortar, reformular, re-grill; sem BUILD não há arquitetura
- **Mudança de UI/UX/operação** → `skills/revenue-centric-design` somente após BUILD
- **Import CSV / qualidade de lista** → `skills/prospect-quality` + Backend/Database
- **Mudança só de UI já aprovada** → Frontend Engineer (+ QA)
- **Lead / atividade / mutações** → Backend (+ Database + Security)
- **Schema / seed** → Database Engineer
- **Antes de merge sensível** → Security Reviewer + QA
- **Antes de subir produção** → Release Manager + `workflows/production-check.md`
- **Validação do piloto** → [`docs/product/pilot-validation-plan.md`](../docs/product/pilot-validation-plan.md)
- **MVP técnico (BUILD)** → [`docs/product/product-decision-mvp-technical.md`](../docs/product/product-decision-mvp-technical.md)
- **Sociedade vs ACL** → [`docs/founding/roles-and-governance.md`](../docs/founding/roles-and-governance.md)
- **MCPs** → [`docs/development/mcp-setup.md`](../docs/development/mcp-setup.md) · rule `mcp-usage`

## Skills de produto

| Skill | Path |
| --- | --- |
| Product grill | [`skills/product-grill/SKILL.md`](skills/product-grill/SKILL.md) |
| Revenue-centric design | [`skills/revenue-centric-design/SKILL.md`](skills/revenue-centric-design/SKILL.md) |
| Prospect quality | [`skills/prospect-quality/SKILL.md`](skills/prospect-quality/SKILL.md) |

## Skills de UI (Chakra UI v3) — padrão

**Product Decision:** [ADOPT CHAKRA v3](../docs/product/product-decision-ui-stack-keep-tailwind.md) · [ADR 0011](../docs/adr/0011-ui-stack-keep-tailwind.md) (migração concluída)

```text
Prospecta UI Stack = Next.js + Chakra UI v3 + design tokens + UI wrappers
Tailwind removido do repositório.
```

Fonte: [chakra-ui.com/docs/get-started/ai/skills](https://chakra-ui.com/docs/get-started/ai/skills).

| Skill | Path | Papel no Prospecta |
| --- | --- | --- |
| Builder | [`skills/chakra-ui-builder/SKILL.md`](skills/chakra-ui-builder/SKILL.md) | Setup, theme, componentes Chakra v3 |
| Migrate | [`skills/chakra-ui-migrate/SKILL.md`](skills/chakra-ui-migrate/SKILL.md) | Só se houver padrões v2 (não é o caso) |
| Refactor | [`skills/chakra-ui-refactor/SKILL.md`](skills/chakra-ui-refactor/SKILL.md) | Review e polish Chakra |

Regra: UI nova só com Chakra. Sem classes Tailwind nem híbridos.
