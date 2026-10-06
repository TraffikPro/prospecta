# Residual Dependency Audit — `braces` (GHSA-vfj7-8cjw-p6xm)

**Date consulted:** 2026-10-06 (America/Sao_Paulo)  
**Branch / HEAD:** `feat/prospecta-core-ui-ux` @ `5de4f7bd6f66202b25f5803db7a9602e67137997`  
**CI command:** `pnpm audit --audit-level high` (pnpm **9.15.9**, Node **22.21.1**)  
**PR:** https://github.com/TraffikPro/prospecta/pull/83  

## 1. Achado confirmado

| Item | Evidência |
| --- | --- |
| Advisory | https://github.com/advisories/GHSA-vfj7-8cjw-p6xm |
| Severidade | high |
| Pacote / range | `braces` `<= 3.0.3` |
| Versão instalada | `3.0.3` |
| Versão corrigida publicada | **nenhuma** (`first_patched_version: null`; npm `latest` = `3.0.3`; `dist-tags.latest` = `3.0.3`) |
| Advisory withdrawn | não (`withdrawn_at: null`; `updated_at: 2026-10-02T22:36:34Z`) |
| Condição | overflow de stack em walkers AST recursivos sem depth guard; padrões brace profundamente aninhados sob o limite de caracteres → `RangeError` e término do processo Node |

Reprodução local (mesmo comando do CI):

```text
pnpm audit --audit-level high
→ 3 vulnerabilities found (2 moderate | 1 high)
→ high = braces only (patched versions <0.0.0)
```

## 2. Cadeias de dependência

Única cadeia no lockfile / `pnpm why braces`:

```text
devDependencies
└─ eslint-config-next@16.3.8
   └─ @next/eslint-plugin-next@16.3.8
      └─ fast-glob@3.3.1          (pinned pelo plugin Next)
         └─ micromatch@4.0.8
            └─ braces@3.0.3
```

- Dependência direta responsável: **`eslint-config-next`** (devDependency).
- Uso de código: `@next/eslint-plugin-next` → `dist/utils/get-root-dirs.js` chama `fast-glob.globSync` (regra `no-html-link-for-pages` e resolução de `rootDir`).
- Grafo **produção** (`pnpm install --prod`, postinstall desabilitado só no teste isolado): **`braces` ausente** (`pnpm why braces` / `pnpm list braces` vazios).
- Em CI e builds Vercel típicos, `devDependencies` são instaladas → o pacote **está presente no disco** durante lint/build, embora não no bundle runtime do app.

## 3. Exposição no Prospecta

| Camada | Avaliação |
| --- | --- |
| A. Pacote presente | Sim — árvore de desenvolvimento / CI |
| B. Caminho alcançável | Sim — lint local (`pnpm lint`) e job CI que roda ESLint; `get-root-dirs` → `fast-glob` → `micromatch` → `braces` |
| C. Entrada potencialmente explorável | Padrões glob / `rootDir` vindos da config ESLint / estrutura do app — **controlados por quem altera o repositório**, não por request HTTP de usuário final |
| D. Exploração demonstrada | Não executada (payloads de exaustão evitados) |

**Não** afirmar “fora de produção” como ausência de risco: o gate CI e o lint processam a cadeia. O impacto plausível é **DoS do processo de lint/CI**, não RCE no app autenticado. Quem já pode abrir PR maliciosa já consegue quebrar CI de várias outras formas.

## 4. Alternativas avaliadas

| # | Alternativa | Resultado | Motivo |
| --- | --- | --- | --- |
| 1 | Versão corrigida oficial de `braces` | **Indisponível** | npm sem release >3.0.3; advisory sem `first_patched_version` |
| 2 | Atualizar `eslint-config-next` / `@next/eslint-plugin-next` | **Descartada** | Já em `16.3.8` alinhado a `next@16.3.8`. `16.4.0` ainda pinna `fast-glob@3.3.1` → mesma cadeia |
| 3 | Atualizar `fast-glob` / `micromatch` | **Descartada** | `fast-glob@3.3.3` e `micromatch@4.0.8` continuam dependendo de `braces@^3.0.3` |
| 4 | Remover `eslint-config-next` | **Descartada neste PR** | Remove regras Next (incl. `no-html-link-for-pages`); perda de cobertura; migração ampla |
| 5 | Substituir tooling de lint | **Descartada neste PR** | Exige redesign de `eslint.config.mjs` e validação de regras; fora do escopo CORE |
| 6 | Override para `@dieub/braces-depth-guard@3.0.3-pn.3` | **Tecnicamente limpa o audit** em sandbox isolado (`No known vulnerabilities found`), **não aplicada** | Pacote de terceiro (repo criado 2026-10-03, 0★); não é release `micromatch/braces`; aceitar seria assumir risco de supply-chain em nome do responsável |
| 7 | `pnpm.patchedDependencies` com patch dos PRs upstream | **Não resolve o gate** | Versão permanece `3.0.3` → advisory continua batendo |
| 8 | PRs upstream abertos | **Aguardar merge + publish** | https://github.com/micromatch/braces/pull/79 , /78 (não mergeados; `package.json` ainda `3.0.3`) |

## 5. Decisão

**Nenhuma correção segura e pequena foi aplicada neste ciclo.**  
O PR #83 permanece **draft**. Não foi criada exceção de audit, ignore, `continue-on-error` nem redução de severidade.

### Condição objetiva para retomar / marcar ready

1. Release oficial `braces` com `first_patched_version` no advisory **ou**  
2. `@next/eslint-plugin-next` / cadeia intermediária publicada sem `braces` vulnerável **ou**  
3. Decisão humana explícita por escrito para (a) override com fork vetado/assinado, ou (b) migração de lint em PR separado.

### Mitigações possíveis (limites)

| Mitigação | Limite |
| --- | --- |
| Manter `eslint-config-next` pinned e não processar globs de fontes não confiáveis | Não zera o gate CI |
| Separar job de audit para `--prod` | Enfraqueceria o gate atual — **não autorizado** |
| Fork interno MIT com OIDC/publish controlado | Trabalho separado + manutenção contínua |

### Proposta de trabalho separado (se humano escolher)

- **Opção A (preferida):** bump de `braces` assim que `micromatch/braces` publicar patch; override mínimo; revalidar audit + lint.  
- **Opção B:** avaliar fork interno (não `@dieub/*` sem due diligence) com testes de profundidade e contrato API de `micromatch`.  
- **Opção C:** flat config sem `@next/eslint-plugin-next` / reimplementação seletiva de regras — PR dedicado com fixture de regressão de lint.

## 6. Estado do PR

- Checks de produto (Quality, Tests, CodeQL, Gitleaks, Vercel Preview) no SHA atual: aprovados na última rodada.  
- Dependency audit: **FAIL residual** somente `braces`.  
- Ready for review: **não** — bloqueio de segurança não resolvido.
