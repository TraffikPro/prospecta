# PR draft — CORE UI/UX comercial (fila → detalhe → Activity)

> Arquivo local apenas. **Não** abre PR remoto. Revisar antes de `gh pr create`.

## Título sugerido

`fix(ui): tighten commercial CORE flow — WhatsApp CTA, post-save, playbook reasons, queue return`

## Problema

No caminho operacional `Minha fila → detalhe → playbook/contato → Activity → retorno`, a UI ainda gerava atrito de apresentação e interação: CTA de canal ambíguo, retorno incompleto (filtro/página), motivos do playbook pouco acessíveis sem hover, pós-save com risco de reenvio, atalho de follow-up podendo sugerir horário passado, e bottom nav mobile sem ícone.

## Comportamento final (escopo CORE)

- Canal: **Abrir WhatsApp** (clique não cria Activity).
- Fila desktop: nome da empresa abre o detalhe; **Abrir** só no mobile; **Registrar** permanece.
- Retorno: preserva origem allowlisted, filtro e página; parâmetros inválidos caem em fallback seguro (sem redirect externo).
- Pós-save: submit some; **Voltar** destacado; campos desabilitados; **Registrar outro contato** reabre formulário limpo; `router.refresh()` a cada sucesso (incluindo 2º registro).
- Playbook: chips + disclosure **Ver motivos** (toque/teclado).
- Follow-up: relativo + data; atalhos só preenchem o campo; **Hoje 18:00** desabilita após o horário com explicação explícita.
- Mobile: bottom nav com ícone + texto.

**Não** reordena Histórico/Activity (permanece VALIDATE com operadores).

## Resumo das mudanças

- UI/UX: contact actions, fila, form de Activity, playbook reasons, nav mobile, breadcrumbs/page.
- Utilitários: `follow-up-presets`, `format-follow-up`.
- `Button` com `forwardRef` para `asChild`.
- Docs de produto alinhadas (nav Aquisição ADMIN-only; status CORE validado localmente).
- Scripts locais: `run-local-e2e.mjs`, `core-ui-ux-visual-qa.mjs` + evidências em `docs/audits/core-ui-ux-closure/`.
- E2E CORE atualizados (motivos, pós-save, scores sintéticos para prioridade na fila).

## Validação executada (técnica local)

Ambiente: Docker `127.0.0.1:5433` · Next `127.0.0.1:3000` · dados sintéticos.

| Camada | Resultado |
| --- | --- |
| Unitários afetados | PASS |
| TypeScript | PASS |
| Lint arquivos tocados | PASS |
| E2E CORE | 16/16 (etapa anterior) + `my-leads` rechecado após fix de refresh |
| QA visual | Empty state e histórico pós-save reinspecionados |

Detalhe: [`REPORT.md`](./REPORT.md).

### Separação explícita

| Tipo | Status |
| --- | --- |
| Validação técnica local | Feita |
| Validação com operadores | **Não feita** (protocolo em `docs/product/operator-core-flow-observation.md`) |
| CI remoto | **Não executado nesta entrega** |
| Produção / smoke prod | **Não executado** |

Não há medição de conversão, produtividade ou tempo de ciclo — não reivindicar ganho comercial.

## Limitações conhecidas

- Ampliação via CDP `pageScaleFactor=2` validada; **zoom real de navegador 200% pendente**.
- Empty-filter visual usou `follow-up` vazio quando `conversation` ainda tinha 2 leads residuais não sintéticos.
- E2E Playwright continua fora do GitHub Actions.
- Overlay de tooling (“1 issue”) em algumas capturas.

## Screenshots relevantes

- `screenshots/desktop-1440x900-activity-success.png`
- `screenshots/desktop-1440x900-queue-empty-filter.png`
- `screenshots/desktop-1440x900-playbook-reasons-expanded-keyboard.png`
- `screenshots/desktop-1440x900-cdp-page-scale-2.png`
- `screenshots/mobile-390x844-bottom-nav.png`

## Riscos materiais

| Risco | Mitigação / nota |
| --- | --- |
| `router.refresh` omitido no 2º save | Corrigido; coberto por E2E |
| Rate-limit scoping em produção | Guard: no-op se `environment === production\|preview` |
| Limpeza de leads no script visual | Só DB local + prefixos sintéticos + mutation guard |
| Tabs `onClick` duplicando `onValueChange` | Idempotente (`setStep`) |
| Docs de Aquisição/nav fora do “CORE UI” estrito | Sincronização factual; sem mudança de ACL |

## Arquivos sugeridos para o commit futuro

Incluir (CORE + evidências + docs alinhados):

- `src/components/ui/button.tsx`
- `src/components/layout/app-shell.tsx`
- `src/components/navigation/*` (breadcrumb, nav-config, nav-icons + tests)
- `src/app/(authenticated)/app/leads/[id]/page.tsx`
- `src/features/activities/create-activity-form.tsx`
- `src/features/activities/follow-up-presets.ts` (+ test)
- `src/features/commercial/components/commercial-playbook-section.tsx`
- `src/features/leads/components/lead-contact-actions.tsx`
- `src/features/leads/components/my-queue-list.tsx`
- `src/features/leads/format-follow-up.ts` (+ test)
- `e2e/my-leads.spec.ts`, `e2e/commercial-playbook.spec.ts`, `e2e/mobile-experience.spec.ts`
- `scripts/run-local-e2e.mjs`, `scripts/core-ui-ux-visual-qa.mjs`
- `docs/audits/core-ui-ux-closure/**`
- `docs/product/operator-core-flow-observation.md`
- `docs/product/status-post-mvp.md`
- `docs/product/product-decision-pilot-screen-map.md`
- `docs/product/product-decision-commercial-nav-ia-v1.md`
- `docs/product/product-decision-acquisition-self-serve-v1.md`

Excluir do commit desta PR (fora de escopo / ruído local):

- `AGENTS.md`, `CLAUDE.md`
- `docs/audits/_f14-qa-log.json`, `docs/audits/_f9-e2e-output.txt`
- `docs/product/assets/social-preview/**`
- `next-env.d.ts` (só se for churn irrelevante do tooling)

## Checklist antes de abrir o PR remoto

- [ ] Commit com mensagem conventional (`fix(ui):` / `feat(ui):`)
- [ ] Push da branch
- [ ] `gh pr create` com este corpo
- [ ] Confirmar que CI do repositório (unit/lint/typecheck/build) roda no PR — sem declarar PASS antecipadamente
