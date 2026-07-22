# MCP setup — Prospecta

Configuração operacional dos Model Context Protocol servers no Cursor **antes** do scaffold.  
Os MCPs aceleram documentação, GitHub, smoke de UI e Figma. **Não** substituem CI nem `@playwright/test`.

## Stack

| MCP | Função | Prioridade |
| --- | --- | ---: |
| Context7 | Docs atuais e versionadas | Obrigatório agora |
| GitHub | Issues, PRs, commits, Actions | Obrigatório agora |
| Playwright | Navegar/validar UI via acessibilidade | Obrigatório agora |
| Figma | Inspecionar UI/UX | Após os três anteriores |

Política de uso: [`.cursor/rules/mcp-usage.mdc`](../../.cursor/rules/mcp-usage.mdc).  
Exemplo versionado: [`.cursor/mcp.example.json`](../../.cursor/mcp.example.json).

## Onde guardar

| Arquivo | Versionar? | Conteúdo |
| --- | --- | --- |
| `.cursor/mcp.example.json` | Sim | Comandos + placeholders de env |
| `.cursor/mcp.json` | **Não** | Cópia local (pode referenciar env); nunca token literal |
| `docs/development/mcp-setup.md` | Sim | Este guia |
| `.env` / `.env.local` | Não | Segredos |

Se `.cursor/mcp.json` tiver **apenas** referências `${env:...}` e URLs públicas (sem token colado), a equipe pode decidir versioná-lo depois. O padrão Prospecta é **ignorar** o arquivo local e versionar o example.

## Pré-requisitos

- Node.js **≥ 18** (projeto usa 20+)
- `npx` disponível
- Docker instalado e em execução (GitHub MCP local oficial)
- Conta GitHub com acesso ao repositório Prospecta
- (Opcional) `CONTEXT7_API_KEY` — [dashboard Context7](https://context7.com/dashboard) para rate limit maior
- (Figma) conta Figma + autenticação OAuth no Cursor

## 1. Context7

```json
"context7": {
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp"],
  "env": {
    "CONTEXT7_API_KEY": "${env:CONTEXT7_API_KEY}"
  }
}
```

API key é opcional para smoke; recomendada no dia a dia.

**Quando usar nos prompts**

```text
Use Context7 para consultar a documentação oficial e compatível com as
versões instaladas antes de implementar Next.js, Prisma, Zod ou Playwright.
```

Usar principalmente para: APIs de framework, auth, migrations, libs novas, comportamento versionado.

## 2. GitHub (oficial)

Usar **somente** o servidor oficial (`ghcr.io/github/github-mcp-server` via Docker, ou remote `https://api.githubcopilot.com/mcp/`).  
O pacote npm `@modelcontextprotocol/server-github` está **depreciado**.

### Local (Docker + PAT) — padrão do example

1. Crie um fine-grained PAT com acesso **apenas** ao repo Prospecta (conteúdos, PRs, issues, Actions conforme necessário).
2. Exporte no shell **antes** de abrir o Cursor:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_..."   # ou fine-grained
# alternativa se já usa gh CLI (não imprima o valor):
export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token)"
```

3. Copie o example:

```bash
cp .cursor/mcp.example.json .cursor/mcp.json
```

4. Reinicie o Cursor e confira o ponto verde em Settings → MCP.

### Remote (alternativa)

```json
"github": {
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer ${env:GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
```

### Segurança

- Nunca colar o token no JSON versionado
- Nunca commit de `.cursor/mcp.json` com segredo
- Escrita só com pedido explícito (ver `mcp-usage.mdc`)
- Escopo mínimo; preferir fine-grained no repo Prospecta

## 3. Playwright MCP

```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@playwright/mcp@latest"]
}
```

### Não confundir

```text
Playwright MCP
→ Cursor opera/inspeciona o browser (smoke assistido)

@playwright/test (no scaffold)
→ testes E2E versionados e CI
```

O MCP **não** substitui a suíte. No scaffold:

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

### Uso permitido

- `localhost`, preview, seed, contas de teste
- Fluxo vertical: login → lead → dedupe → stage → handoff → atividade → próximo passo

### Uso proibido

- Contas pessoais reais dos sócios
- Produção com dados reais de leads sem autorização explícita

## 4. Figma MCP

Depois que Context7, GitHub e Playwright estiverem verdes:

```json
"figma": {
  "url": "https://mcp.figma.com/mcp"
}
```

Preferência oficial: plugin Cursor (`/add-plugin figma`) ou remote URL + OAuth na UI.  
Figma **não** bloqueia scaffold de Next/Prisma/auth/ACL.

Ordem mental:

```text
Context7 → implementação atual
GitHub → governança
Playwright → comportamento
Figma → experiência visual
```

## Ativação rápida

```bash
cp .cursor/mcp.example.json .cursor/mcp.json
export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token)"
# opcional:
export CONTEXT7_API_KEY="..."
```

Reinicie o Cursor. Rode o comando [`.cursor/commands/verify-mcps.md`](../../.cursor/commands/verify-mcps.md).

## Smoke de aceitação

### Context7

```text
Use Context7 e informe qual é a forma recomendada atualmente de configurar
Prisma com Next.js App Router. Não altere arquivos.
```

Esperado: encontra a lib, traz docs, cita contexto/versão, sem mudar o repo.

### GitHub

```text
Use o GitHub MCP para ler o repositório atual, informar a branch padrão,
o último commit e listar arquivos na raiz. Não faça alterações.
```

Esperado: acessa o repo correto; `main`; commit da fundação; sem criar issue/PR.  
**Nota:** o remote GitHub do Prospecta precisa existir (`gh repo create` / push). Até lá, o smoke pode validar autenticação listando o usuário e falhar só na leitura do repo ausente — declare isso explicitamente.

### Playwright

Com servidor local de smoke (ou app depois do scaffold):

```text
Use Playwright para abrir a aplicação local e retornar o título,
a URL atual e a estrutura principal de acessibilidade. Não preencha formulários.
```

### Figma

```text
Use o Figma apenas para inspecionar o arquivo indicado e listar páginas,
frames principais, componentes e variáveis. Não altere o arquivo.
```

## Fallback nesta sessão / CI

| MCP | Fallback aceitável |
| --- | --- |
| Context7 | Docs oficiais na web + skill/CLI `ctx7` se instalado |
| GitHub | `gh` CLI (leitura) |
| Playwright MCP | `cursor-ide-browser` só para smoke IDE; E2E = `@playwright/test` |
| Figma | Inspeção manual no app Figma |

## Relação com o scaffold

Após este setup + smoke dos três primeiros:

1. Commit `chore: configure project MCP development workflow`
2. Scaffold Next.js + Prisma + auth + fluxo vertical
3. Usar Context7 nas APIs versionadas
4. Converter fluxos Playwright MCP aprovados em E2E

## Checklist

- [ ] `.cursor/mcp.json` local criado a partir do example
- [ ] `GITHUB_PERSONAL_ACCESS_TOKEN` no ambiente (escopo mínimo)
- [ ] Docker rodando (se usar GitHub local)
- [ ] Context7 responde
- [ ] GitHub MCP responde (leitura)
- [ ] Playwright MCP abre página de smoke
- [ ] Figma conectado (depois)
- [ ] Nenhum token no git
