# Product Decision — Weekly portfolio fill runner (F3)

- **Data:** 2026-08-13
- **Decisão:** **BUILD**
- **Classificação:** PLATFORM (job / IDs / assignment) · WORKSPACE (Completar minha carteira)
- **Branch:** `feat/weekly-portfolio-fill-runner-f3`
- **Pré-requisito:** F1 e F2 em `main`
- **Não autoriza:** dashboard, KPIs, badges, lazy enrollment, auto-recycle

## Sequência canônica

```text
F1 = DONE
F2 = DONE
F3 = DONE / E2E PASS
F4 = BUILD agora
DASHBOARD/KPIs/BADGES = depois
```

## Hipótese

Se o operador autorizado clicar **Completar minha carteira** com meta e vagas, o runner buscar de forma adaptativa e o CRM atribuir somente IDs internos HIGH elegíveis daquela execução, então a carteira fecha sem pull manual do ADMIN e sem lazy enrollment.

## Invariantes

```text
Completar carteira é mutação explícita.
Abrir Minha fila continua read-only.
Generator deve retornar IDs internos.
requestedBy vem da identidade autenticada.
Cap F2 e recycle explícito continuam valendo.
```

## Escopo autorizado

1. CTA na Minha fila (sem KPI global novo)
2. `AcquisitionJob.purpose = WALLET_FILL` + `requestedSlots` / `assignedCount`
3. `requestedById` da sessão (já existia; F3 passa a usá-lo como dono da carteira)
4. Callback com `leadIds[]` (IDs internos Prospecta)
5. Atribuição via primitive de domínio, `source: NEW_ACQUISITION`
6. Um job F3 ativo por operador + semana (fingerprint `fill|{userId}|{weekStart}`)
7. Oversample simples: `batchSize = min(max(remaining * 2, 4), 30)`
8. Resultado parcial é sucesso operacional (sem status PARTIAL)

## Fora desta PR

- Cron / fechamento automático da semana (F4) → [product-decision-weekly-portfolio-close-f4.md](product-decision-weekly-portfolio-close-f4.md) (**BUILD agora**)
- Dashboard, KPIs, badges
- Lazy enrollment / `ENROLL_OWNED`
- Auto-recycle
- Nova tela admin de jobs

## Métrica

Operador com vagas clica Completar → job com o próprio `requestedById` → callback com `leadIds` → HIGH elegíveis atribuídos até a meta; refresh não cria job novo.
