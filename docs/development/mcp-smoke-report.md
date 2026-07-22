# MCP smoke report — Prospecta

Última atualização: 2026-07-22 (gate pré-scaffold)

## Gate da sessão atual

| Check | Status |
| --- | --- |
| `.cursor/mcp.json` local | Presente (gitignored); `npx` → caminho absoluto NVM |
| Correção `spawn npx ENOENT` | Aplicada: `/home/gustavo/.nvm/versions/node/v20.20.0/bin/npx` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Exportar de novo ao reabrir o Cursor pelo terminal |
| Context7 / GitHub / Playwright na sessão | Aguardam **reinício completo** do Cursor |
| Scaffold autorizado | **NÃO** — aguarda ponto verde + `verify-mcps` |

Após o fix, reinicie com `pkill -f cursor` (se necessário) e `cursor .` a partir do repo.

## Smoke prévio (pacotes oficiais fora da sessão Cursor)

| MCP | Status | Evidência |
| --- | --- | --- |
| Context7 | OK (stdio) | `/prisma/prisma` + docs Next/HMR |
| GitHub | PARCIAL (Docker) | Auth OK; remote Prospecta inexistente |
| Playwright | OK (boot + HTML) | 24 tools; `mcp-smoke.html` inspecionada |
| Figma | Pendente | Não bloqueia scaffold técnico |

## Git local

- Branch: `main`
- Commits esperados no remote futuro: `1008f80`, `b025c7b` (+ commits seguintes)
- Remotes: nenhum

## O que fazer no reload

1. No **mesmo terminal** onde o token foi exportado:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token)"
cd /home/gustavo/Documentos/prospecta
cursor .   # ou reabra o projeto a partir deste ambiente
```

> Se o Cursor for aberto pelo menu gráfico, ele pode **não** herdar o `export`. Nesse caso, cole o token só no `.cursor/mcp.json` local (gitignored) ou configure o env em Settings → MCP → GitHub.

2. Settings → MCP → Context7, GitHub, Playwright com **ponto verde**.
3. Nesta conversa (ou nova), pedir: executar `verify-mcps`.
4. Atualizar este report com o resultado **na sessão**.
5. Só então: scaffold técnico (sem telas finais / sem CRM completo).

## Figma

Pendente. Não bloqueia Next/Prisma/auth/schema/CI. Conectar antes das telas definitivas.
