## Summary

Melhora o fluxo comercial CORE (`Minha fila → detalhe → Activity → retorno`) sem alterar regras de domínio, schema ou ACL.

### Problema
CTA de canal ambíguo, retorno incompleto à fila, motivos do playbook pouco acessíveis sem hover, pós-save com risco de reenvio, atalho de follow-up podendo sugerir horário passado, e bottom nav mobile só com texto.

### Comportamento final
- Canal: **Abrir WhatsApp** (clique não cria Activity)
- Fila desktop: nome da empresa abre o detalhe; **Abrir** só no mobile; **Registrar** permanece
- Retorno: preserva origem allowlisted, filtro e `page` (quando válido); sem redirect externo
- Pós-save: submit some; **Voltar** destacado; campos desabilitados; **Registrar outro contato** limpa o formulário
- Correção: `router.refresh()` a cada save bem-sucedido (incluindo o 2º registro após "Registrar outro contato")
- Playbook: chips + disclosure **Ver motivos** (toque/teclado); etapas em botões acessíveis (tablist) estáveis no mobile
- Follow-up: relativo + data; atalhos só preenchem o campo; **Hoje 18:00** desabilita após o horário com explicação
- Mobile: bottom nav com ícone + texto

Não reordena Histórico/Activity (permanece VALIDATE com operadores).

## Dependency audit (commit `9d9e941`)

Comando CI: `pnpm audit --audit-level high` (pnpm 9.15.9).

| Achado | Antes | Correção |
| --- | --- | --- |
| **critical** `next` GHSA-vcvr-r3jv-pc5j (RCE `next/og` ImageResponse) | `16.3.3` | **`16.3.8`** (+ `eslint-config-next@16.3.8`) |
| **high** `brace-expansion` GHSA-qhr7 / GHSA-6j4f | overrides `1.1.18` / `5.0.9` | overrides **`1.1.20`** / **`5.0.11`** |
| **high** `sharp` GHSA-wq5f (librsvg) | `0.35.4` via next | override **`0.35.5`** |
| **high** `source-map-js` GHSA-68fv | `1.2.1` via postcss | override **`1.2.2`** |
| **high** `braces` GHSA-vfj7-8cjw-p6xm | `3.0.3` via eslint-config-next → fast-glob → micromatch | **Sem versão oficial corrigida** (reconfirmado 2026-10-06). Ver diagnóstico completo abaixo. |

### Residual `braces` (reinvestigado 2026-10-06)

- Fontes: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), npm `braces@latest` = `3.0.3`, `first_patched_version: null`.
- Cadeia única: `eslint-config-next@16.3.8` → `@next/eslint-plugin-next` → `fast-glob@3.3.1` → `micromatch@4.0.8` → `braces@3.0.3` (**devDependency**; ausente em `pnpm install --prod`).
- Exposição: lint/CI via `get-root-dirs` → `fast-glob`; entrada = config/estrutura do repo, não HTTP de usuário. DoS de processo de lint plausível; exploração não demonstrada.
- Alternativas testadas/descartadas: bump Next 16.4 (mesma pin de `fast-glob`); upgrade `fast-glob`/`micromatch` (ainda trazem `braces`); remoção/substituição de `eslint-config-next` (perda de cobertura — PR separado); override `@dieub/braces-depth-guard` **limpa o audit em sandbox** mas **não aplicado** (fork de terceiro sem due diligence — não aceitar risco pelo responsável).
- Detalhe: [`BRACES_AUDIT_RESIDUAL.md`](./BRACES_AUDIT_RESIDUAL.md).

Este PR permanece **draft** até release oficial de `braces` patched, mudança de cadeia pelo Next, ou decisão humana explícita.

## Validation

### Local no SHA `9d9e941` (deps) — Docker `127.0.0.1:5433`
| Check | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm audit --audit-level high` | FAIL residual: só `braces` high (+ 2 moderate) |
| TypeScript | PASS |
| ESLint arquivos CORE | PASS |
| Unitários (`pnpm test`, DB local) | PASS 353/353 |
| `pnpm build` | PASS |
| E2E CORE 16/16 | PASS (reexecutado após upgrade Next) |

### Remoto
- SHA CORE `4addc2e`: Quality/Tests/CodeQL/Gitleaks PASS; Dependency audit FAIL (antes da correção de deps).
- SHA deps `9d9e941` / docs `5de4f7b`: Quality/Tests/CodeQL/Gitleaks/Vercel Preview PASS; Dependency audit FAIL residual (`braces` only).

## Vercel

- Sem deployment manual nesta entrega.
- Check Vercel em `4addc2e`: SUCCESS com URL de deployment Vercel (preview automático do PR, não produção). Ambiente Production **não confirmado** como alvo do check.
- Novo preview esperado para `9d9e941` após o push.

## Limitations
- Ampliação via CDP `pageScaleFactor=2` validada; **zoom real de navegador 200% pendente**
- Observação com operadores pendente
- E2E Playwright fora do GitHub Actions
- Dependency audit residual: **`braces@3.0.3` sem patch upstream**

Não há medição de conversão, produtividade ou tempo de ciclo.

## Test plan
- [ ] Minha fila: filtro → detalhe → Activity → Voltar preserva filtro
- [ ] Desktop: sem CTA Abrir duplicado; mobile: Abrir disponível
- [ ] Pós-save: Voltar + Registrar outro; 2º contato aparece no Histórico
- [ ] Playbook: Ver motivos por clique e teclado
- [ ] Abrir WhatsApp / copiar mensagem não cria Activity
- [ ] Atalho Hoje 18:00 desabilitado após 18:00
- [ ] CI: Dependency audit — esperado FAIL até release de `braces` patched
- [ ] Demais checks CI no SHA `9d9e941`