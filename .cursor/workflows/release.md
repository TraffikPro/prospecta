# Workflow — Release

Atuar como Release Manager.

Além de qualidade técnica, registrar **hipótese, métrica e plano de observação**
quando a release incluir mudança de produto/UX/operação.
Skills: `.cursor/skills/product-grill/SKILL.md`,
`.cursor/skills/revenue-centric-design/SKILL.md`.
Piloto: `docs/product/pilot-validation-plan.md`.

## 1. Ambiente

- Conferir envs de produção (ver `production-check.md`)
- Confirmar que `.env` local não sobe para o git

## 2. Banco

- Migrations pendentes aplicadas no alvo (quando aplicável)
- Seed apenas se necessário e com dados seguros/fictícios

## 3. Qualidade técnica

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- E2E quando aplicável
- Documentação atualizada quando a mudança exigir
- Plano de rollback técnico conhecido

## 4. Smoke test

- Login
- Pipeline carrega
- Criar lead + atividade
- Handoff WhatsApp/e-mail

## 5. Product Decision na release

Consultar o resumo `## Product Decision` da PR (ou Exception).

Quando a release incluir mudança de produto/UX/operação, responder:

- hipótese
- métrica
- validation owner
- observation window
- success / adjustment / stop criteria

## 6. Go / no-go

- Listar blockers
- Decisão explícita
