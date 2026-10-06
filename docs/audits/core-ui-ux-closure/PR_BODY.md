## Summary

Melhora o fluxo comercial CORE (`Minha fila → detalhe → Activity → retorno`) sem alterar regras de domínio, schema ou ACL.

### Problema
CTA de canal ambíguo, retorno incompleto à fila, motivos do playbook pouco acessíveis sem hover, pós-save com risco de reenvio, atalho de follow-up podendo sugerir horário passado, e bottom nav mobile só com texto.

### Comportamento final
- Canal: **Abrir WhatsApp** (clique não cria Activity)
- Fila desktop: nome da empresa abre o detalhe; **Abrir** só no mobile; **Registrar** permanece
- Retorno: preserva origem allowlisted, filtro e `page` (quando válido); sem redirect externo
- Pós-save: submit some; **Voltar** destacado; campos desabilitados; **Registrar outro contato** limpa o formulário
- Correção: `router.refresh()` a cada save bem-sucedido (incluindo o 2º registro após “Registrar outro contato”)
- Playbook: chips + disclosure **Ver motivos** (toque/teclado); etapas em botões acessíveis (tablist) estáveis no mobile
- Follow-up: relativo + data; atalhos só preenchem o campo; **Hoje 18:00** desabilita após o horário com explicação
- Mobile: bottom nav com ícone + texto

Não reordena Histórico/Activity (permanece VALIDATE com operadores).

## Validation (local)

Ambiente: Docker Postgres `127.0.0.1:5433` · Next local · dados sintéticos. Produção não usada.

| Check | Resultado | Estado do código |
| --- | --- | --- |
| Unitários afetados (presets, breadcrumb, follow-up, nav) | PASS | commit `c1a7899` + follow-up de estabilidade |
| TypeScript (`tsc --noEmit`) | PASS | branch final |
| Lint arquivos tocados | PASS | branch final |
| E2E CORE completo 16/16 | PASS | reexecutado na branch final após estabilidade playbook/breadcrumbs/fila |
| E2E `my-leads` (2º contato + refresh) | PASS | incluído na suíte 16/16 da branch final |

Detalhe: `docs/audits/core-ui-ux-closure/REPORT.md`

### Separação explícita
- E2E CORE 16/16 da rodada anterior (working tree pré-port): histórico de validação
- E2E CORE 16/16 reexecutado na branch `feat/prospecta-core-ui-ux` após correções de estabilidade (este SHA)
- CI remoto: acompanhar neste PR (Quality/Tests/CodeQL/Gitleaks verdes no SHA anterior; Dependency audit falha também em `main` — bloqueio externo pré-existente)

### Não executado
- Produção / smoke prod
- Observação com operadores
- Zoom real de navegador 200% (CDP page scale validado; não é zoom de browser)

Não há medição de conversão, produtividade ou tempo de ciclo.

## Screenshots

- `docs/audits/core-ui-ux-closure/screenshots/desktop-1440x900-activity-success.png`
- `docs/audits/core-ui-ux-closure/screenshots/desktop-1440x900-queue-empty-filter.png`
- `docs/audits/core-ui-ux-closure/screenshots/desktop-1440x900-playbook-reasons-expanded-keyboard.png`
- `docs/audits/core-ui-ux-closure/screenshots/desktop-1440x900-cdp-page-scale-2.png`
- `docs/audits/core-ui-ux-closure/screenshots/mobile-390x844-bottom-nav.png`

## Test plan
- [ ] Minha fila: filtro → detalhe → Activity → Voltar preserva filtro
- [ ] Desktop: sem CTA Abrir duplicado; mobile: Abrir disponível
- [ ] Pós-save: Voltar + Registrar outro; 2º contato aparece no Histórico
- [ ] Playbook: Ver motivos por clique e teclado
- [ ] Abrir WhatsApp / copiar mensagem não cria Activity
- [ ] Atalho Hoje 18:00 desabilitado após 18:00
- [ ] Checks do CI do PR

## Limitations
- Ampliação via CDP `pageScaleFactor=2` validada; zoom real 200% pendente
- E2E Playwright fora do GitHub Actions
- Reorder Histórico/Activity aguarda evidência de operadores
- Dependency audit (high/critical) falha também em `main` (deps transitivas: brace-expansion, braces, sharp, etc.) — fora do escopo desta PR
