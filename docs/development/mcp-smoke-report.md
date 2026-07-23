# MCP smoke report — Prospecta

Última atualização: 2026-07-23 (verify-mcps **na sessão Cursor**)

## Gate

| Check | Status |
| --- | --- |
| Context7 na sessão | **OK** (`project-0-prospecta-context7`) |
| GitHub na sessão | **OK** auth (`project-0-prospecta-github`) |
| Playwright na sessão | **OK** (`project-0-prospecta-playwright`) |
| Figma na sessão | **OK** (`project-0-prospecta-figma`, autenticado) |
| Scaffold técnico autorizado | **SIM** (Figma não bloqueia fundação) |

## verify-mcps (sessão)

| MCP | Status | Evidência |
| --- | --- | --- |
| Context7 | **OK** | `resolve-library-id` → `/prisma/prisma`; `query-docs` retornou padrão singleton Prisma + Next.js HMR |
| GitHub | **PARCIAL** | `get_me` → `gustavomarques00`; `search_repositories` prospecta = 0 (sem remote) |
| Playwright | **OK** | Abriu `http://127.0.0.1:8765/mcp-smoke.html`; título **Prospecta MCP Smoke**; snapshot com `main`, `navigation`, regions |
| Figma | **OK** | `whoami` → Gustavo Marques (não bloqueia scaffold) |

## Git local

- Branch: `main`
- Commits: `1008f80`, `b025c7b`, `7b57c86`
- Remotes: nenhum — resolver antes do primeiro push/PR

## Próximo

Scaffold técnico (Next.js + TS + pnpm + Prisma + lint/typecheck + schema inicial), **sem** telas finais de CRM.
