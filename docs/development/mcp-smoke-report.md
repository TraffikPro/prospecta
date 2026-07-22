# MCP smoke report — Prospecta

Data: 2026-07-22  
Ambiente: local (Node 20, Docker, `gh` autenticado)  
Método: stdio/Docker direto nos pacotes oficiais + inspeção de página de smoke.  
Os MCPs precisam ser **recarregados no Cursor** (Settings → MCP) a partir de `.cursor/mcp.json` local.

## Resultado

| MCP | Status | Evidência |
| --- | --- | --- |
| Context7 | **OK** | Tools `resolve-library-id`, `query-docs`; resolveu `/prisma/prisma`; docs do singleton Prisma + Next.js HMR |
| GitHub | **PARCIAL** | Docker `ghcr.io/github/github-mcp-server` OK; `get_me` → `gustavomarques00`; **repo remoto Prospecta ainda não existe** |
| Playwright | **OK** (boot + página) | `@playwright/mcp` sobe com 24 tools; página `http://127.0.0.1:8765/mcp-smoke.html` → título **Prospecta MCP Smoke**, nav/regions no snapshot de acessibilidade |
| Figma | **NÃO CONFIGURADO** | URL no example; OAuth no Cursor após os três verdes |

## Git local (aceitação parcial do GitHub)

- Branch: `main`
- HEAD: `1008f80` (`docs: establish founder-led MVP product foundation`)
- Remotes: nenhum — criar repo + `git push -u` antes do smoke completo de leitura do repositório remoto

## Ações humanas restantes

1. Reiniciar Cursor / habilitar servers em Settings → MCP (ponto verde)
2. `export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token)"` (ou PAT fine-grained só do Prospecta)
3. (Opcional) `CONTEXT7_API_KEY`
4. Criar remote GitHub do Prospecta quando for versionar o código remoto
5. Conectar Figma (`/add-plugin figma` ou OAuth no server `figma`)
6. Rodar `.cursor/commands/verify-mcps.md` **dentro** do Cursor com os MCPs carregados

## Segurança

- Nenhum token foi gravado em arquivo versionado
- `.cursor/mcp.json` local está no `.gitignore`
