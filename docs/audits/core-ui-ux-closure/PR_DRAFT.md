# PR draft — CORE UI/UX comercial (fila → detalhe → Activity)

> Publicado como draft em https://github.com/TraffikPro/prospecta/pull/83

## Título

`Improve Prospecta core commercial workflow`

## Problema

No caminho operacional `Minha fila → detalhe → playbook/contato → Activity → retorno`, a UI ainda gerava atrito de apresentação e interação: CTA de canal ambíguo, retorno incompleto (filtro/página), motivos do playbook pouco acessíveis sem hover, pós-save com risco de reenvio, atalho de follow-up podendo sugerir horário passado, e bottom nav mobile sem ícone.

## Comportamento final (escopo CORE)

- Canal: **Abrir WhatsApp** (clique não cria Activity).
- Fila desktop: nome da empresa abre o detalhe; **Abrir** só no mobile; **Registrar** permanece.
- Retorno: preserva origem allowlisted, filtro e página; parâmetros inválidos caem em fallback seguro (sem redirect externo).
- Pós-save: submit some; **Voltar** destacado; campos desabilitados; **Registrar outro contato** reabre formulário limpo; `router.refresh()` a cada sucesso (incluindo 2º registro).
- Playbook: chips + disclosure **Ver motivos** (toque/teclado); etapas como botões tablist estáveis no mobile.
- Follow-up: relativo + data; atalhos só preenchem o campo; **Hoje 18:00** desabilita após o horário com explicação explícita.
- Mobile: bottom nav com ícone + texto.

**Não** reordena Histórico/Activity (permanece VALIDATE com operadores).

## Validação

Ambiente: Docker `127.0.0.1:5433` · Next `127.0.0.1:3000` · dados sintéticos.

| Camada | Resultado |
| --- | --- |
| Unitários afetados | PASS |
| TypeScript | PASS |
| Lint arquivos tocados | PASS |
| E2E CORE 16/16 (pré-port) | PASS |
| E2E CORE 16/16 (branch final pós-estabilidade) | PASS |
| CI Quality/Tests/CodeQL/Gitleaks | PASS em `c1a7899` |
| CI Dependency audit | FAIL também em `main` (pré-existente) |

Corpo publicado: [`PR_BODY.md`](./PR_BODY.md) · detalhe: [`REPORT.md`](./REPORT.md).

## Limitações

- Zoom real de navegador 200% pendente (CDP page scale ≠ zoom de browser).
- Observação com operadores pendente.
- E2E Playwright fora do GitHub Actions.
- Dependency audit pré-existente em `main`.

## Arquivos no commit (escopo)

Incluídos: UI CORE, utilitários follow-up, Button forwardRef, e2e, scripts locais, `docs/audits/core-ui-ux-closure/**`, docs de status/observação alinhados.

Excluídos (preservados localmente): `AGENTS.md`, `CLAUDE.md`, audits `_f14`/`_f9`, `social-preview/**`, `next-env.d.ts`.
