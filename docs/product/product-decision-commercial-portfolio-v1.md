# Portfolio Comercial v1 — Decision BUILD → DONE

- **Data:** 2026-07-24
- **Decisão:** **BUILD** → **DONE** (shipped)
- **Classificação:** WORKSPACE (Prospecta CRM)
- **PR:** [#20](https://github.com/TraffikPro/prospecta/pull/20) (merged `629b40b`)
- **Produção:** `https://prospecta-ten-tau.vercel.app`
- **Follow-up de produto:** recomendação automática de modelo no Lead Detail — grill separado, só após uso real do catálogo manual

## Product Decision

```text
Places pipeline: DONE (generator)
Lote Santos: VALIDATE
Portfolio Comercial v1: BUILD → DONE
Lead Detail model recommendation: OUT (grill futuro)
```

## Escopo autorizado (entregue)

1. `/app/portfolio` — catálogo estático Zod (sem Prisma)
2. Três modelos demonstrativos de Odontologia (DevFlow Labs)
3. Filtro por nicho (só nichos com modelos)
4. Abrir demonstração + Copiar link (URL absoluta via `NEXT_PUBLIC_APP_URL`)
5. Nav desktop Portfólio; mobile via Mais
6. Demos públicos em `/portfolio/*/index.html` sem autenticação
7. Disclaimer explícito: modelo / site-conceito — não case de cliente

## Fora

- Prisma / CRUD admin
- Recomendação automática no Lead Detail
- Analytics / cobrança / Activity automática
- Alegações de clientes ou resultados reais
- Alteração de score ou Places

## Smoke produção (2026-07-24)

Script opcional (sem credenciais no repo): `scripts/smoke-portfolio-prod.mjs`  
Smoke autenticado concluído via **checklist manual** com ADMIN e MEMBER reais.

| Check | Resultado |
|--------|-----------|
| Deploy produção com demos `200` | PASS |
| Três demos em sessão anônima + disclaimer DevFlow Labs | PASS |
| `/app/portfolio` exige login | PASS |
| ADMIN — Portfólio na nav desktop, catálogo, abrir/copiar, Minha fila | PASS |
| MEMBER — Mais → Portfólio em `390px`, sem overflow, sessão preservada, Minha fila | PASS |
| Copiar link → URL absoluta de produção | PASS |

## Decisão

```text
SMOKE_AUTH_PENDING → DONE
```
