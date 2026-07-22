# Command — verify-mcps

```text
Atue como Release Manager + QA do Prospecta.

Execute o smoke de aceitação dos MCPs documentado em docs/development/mcp-setup.md.

Ordem:
1. Context7 — docs Prisma + Next.js App Router (somente leitura; não alterar arquivos)
2. GitHub — ler repo/branch/último commit (somente leitura; sem issue/PR/tag)
3. Playwright — abrir app local ou página de smoke; título, URL, árvore de acessibilidade
4. Figma (se configurado) — inspecionar arquivo indicado; listar páginas/frames; sem mutação

Para cada MCP reportar:
- status: OK | BLOQUEADO | NÃO CONFIGURADO
- evidência objetiva (versão/contexto, SHA, URL, etc.)
- o que falta para ficar verde

Regras:
- Não criar issue, PR, commit, tag ou release
- Não preencher formulários nem alterar dados no browser
- Não expor tokens ou conteúdo de .env
- Se o MCP não estiver carregado nesta sessão, declare e use o fallback documentado (sem fingir sucesso)

Contexto opcional:
{{NOTAS_AMBIENTE}}
```
