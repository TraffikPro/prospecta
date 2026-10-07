# CORE UI/UX closure — resultados locais

- **Data:** 2026-10-06
- **Branch:** `feat/prospecta-core-ui-ux` (worktree a partir de `origin/main` @ `b9194c4`)
- **HEAD publicado:** `c1a7899` + commit de estabilidade E2E/playbook mobile
- **Ambiente:** Docker Postgres `127.0.0.1:5433` / db `prospecta` · Next `127.0.0.1:3000` com `PROSPECTA_E2E_RATE_LIMIT_SCOPING=1`
- **Produção:** não usada (override de `DATABASE_URL` no processo; guard de mutação nos scripts)
- **Veredito:** **VALIDADO LOCALMENTE** (com limitações honestas abaixo)

## Revisão do diff (esta etapa)

| Área | Conclusão |
| --- | --- |
| `Button` + `forwardRef` | Compatível com `asChild` / foco |
| Tabs playbook `onClick` + `onValueChange` | Idempotente; teclado via Tabs.Root |
| Pós-save / Registrar outro | Submit some; Fieldset disabled; limpeza de campos |
| Refresh do histórico | **Bug:** `useEffect([state.ok])` não refresha no 2º save — **corrigido** com `router.refresh()` a cada sucesso |
| Origem / filtro / página | `buildLeadReturnHref` / `parsePageParam`; fallback seguro |
| Presets de data | Desabilita Hoje 18:00 passado sem trocar para amanhã |
| Disclosure motivos | Toque/teclado; conteúdo sob demanda |
| Rate-limit E2E | `scopeRateLimitIdentityForE2E` no-op em `production`/`preview` |
| Limpeza sintética | Scripts só em `127.0.0.1:5433` + prefixos `e2e-`/`qa-` / nomes QA |

Nenhuma proteção de ACL/rate-limit de produção foi enfraquecida.

## Correções nesta etapa

1. `router.refresh()` em todo save bem-sucedido (inclui 2º registro).
2. E2E `my-leads`: assert do 2º contato + `exact: true`.
3. Script visual: waits observáveis (empty / timeline); seed overdue com Activity; limpeza sintética; classificação de zoom.

## Checks

| Check | Resultado | Estado do código |
| --- | --- | --- |
| Unitários presets/breadcrumb/format-follow-up | PASS (10) | commit `c1a7899` |
| `tsc --noEmit` | PASS | commit `c1a7899` |
| ESLint arquivos tocados | PASS | commit `c1a7899` |
| E2E `my-leads` (refresh 2º save) | PASS | após fix refresh; reincluído na suíte final |
| E2E CORE completo 16/16 (pré-port) | PASS | working tree original |
| E2E CORE completo 16/16 (branch final) | PASS | após estabilidade playbook Button-tabs + e2e breadcrumbs/fila |
| QA visual local | PASS (capturas reinspecionadas) | após fix script |
| CI remoto Quality/Tests/CodeQL/Gitleaks | PASS | SHA `c1a7899` |
| CI Dependency audit | FAIL (pré-existente em `main`) | bloqueio externo; fora do escopo CORE |

## Matriz de QA visual (atualizada)

| Cenário | 1440×900 | 1280×720 | 390×844 | Ampliação |
| --- | --- | --- | --- | --- |
| Fila com conteúdo | PASS | PASS | PASS | CDP page scale 2× PASS |
| Fila filtro vazio (empty state final) | PASS (`follow-up` vazio; `conversation` tinha 2 leads residuais) | PASS | PASS | — |
| Lead atrasado / sem canal / WON / LOST | PASS | PASS | PASS | — |
| Sucesso + histórico persistido | PASS | — | — | — |
| Motivos teclado/clique | PASS | — | — | — |
| Bottom nav ícone+texto | — | — | PASS | — |

## Zoom — classificação exata

- **Método validado:** CDP `Emulation.setPageScaleFactor` (`pageScaleFactor=2`) — ampliação visual tipo pinch/page scale.
- **Não é:** zoom real do navegador (Ctrl+/-) com reflow de layout; `deviceScaleFactor`; CSS `zoom`; redução de viewport.
- **Tentativa de zoom real:** Playwright `Control++` — métricas de layout **não** mudaram (`browserZoomApplied: false`).
- **Status:** Ampliação via CDP validada; **zoom real de navegador 200% pendente.**
- Evidência: [`zoom-classification.json`](./zoom-classification.json) · shot `desktop-1440x900-cdp-page-scale-2.png`

## Screenshots

Diretório: [`screenshots/`](./screenshots/)

Principais (reinspecionadas nesta etapa):

- `desktop-1440x900-queue-empty-filter.png` — empty state final
- `desktop-1440x900-activity-success.png` — histórico com atividade salva + Voltar
- `desktop-1440x900-cdp-page-scale-2.png` — CDP page scale (não zoom de browser)
- `mobile-390x844-bottom-nav.png`

## Pendências / limitações (não bloqueiam publicação local)

1. Zoom real de navegador 200% pendente (CDP ≠ zoom de browser).
2. Validação HTML5 `required` nativa (sem Alert custom).
3. Overlay “N / 1 issue” do ambiente de automação.
4. E2E Playwright fora do GitHub Actions.
5. Observação com operadores (reorder Histórico/Activity) permanece VALIDATE.
6. CI remoto / produção / operadores: **NÃO EXECUTADO**.

## Como repetir

```powershell
$env:DATABASE_URL="postgresql://prospecta:prospecta@127.0.0.1:5433/prospecta"
$env:UPSTASH_REDIS_REST_URL=""
$env:UPSTASH_REDIS_REST_TOKEN=""
$env:RATE_LIMIT_KEY_SECRET=""
$env:NEXT_PUBLIC_APP_URL="http://127.0.0.1:3000"
$env:PROSPECTA_E2E_RATE_LIMIT_SCOPING="1"
# next dev --hostname 127.0.0.1 --port 3000
node scripts/run-local-e2e.mjs test e2e/my-leads.spec.ts
.\node_modules\.bin\tsx.cmd scripts/core-ui-ux-visual-qa.mjs
```
