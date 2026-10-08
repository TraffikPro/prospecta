# Ignored Build Step — só `docs/**`

A Vercel executa `bash scripts/vercel-ignored-build-step.sh` antes do build (`ignoreCommand` em `vercel.json`).

## Política

O script compara `VERCEL_GIT_PREVIOUS_SHA` (último deployment bem-sucedido **desta branch**) com `HEAD`.

- **SKIP** (exit 0) somente se todos os paths do intervalo estiverem em `docs/**`.
- **BUILD** (exit diferente de 0) em qualquer outro caso, inclusive:
  - `VERCEL_GIT_PREVIOUS_SHA` ou `VERCEL_GIT_COMMIT_SHA` ausente;
  - `HEAD` diferente de `VERCEL_GIT_COMMIT_SHA`;
  - SHA anterior fora do clone;
  - falha de `git diff`;
  - diff vazio;
  - qualquer path fora de `docs/**` (incluindo `README.md`, `scripts/`, `e2e/`, `src/`, `prisma/`, lockfile e configuração).

O diff usa `git diff --no-renames --name-only -z`. Um rename entre `src/` e `docs/` aparece como remoção e adição, então o build segue.

O primeiro deployment bem-sucedido de uma branch não tem SHA anterior. Nesse caso o script faz BUILD. Isso não é falha.

O cron diário em `vercel.json` (`/api/cron/weekly-portfolio-close`, `0 6 * * *`) não entra nessa decisão.

## Rollback

1. Remover `ignoreCommand` de `vercel.json`.
2. Remover `scripts/vercel-ignored-build-step.sh` se o comando não for mais referenciado.
3. Fazer push. O deployment seguinte volta a buildar todo commit.

Não é necessário alterar o dashboard: `ignoreCommand` no repositório substitui o Ignored Build Step do projeto enquanto o arquivo estiver no commit buildado.
