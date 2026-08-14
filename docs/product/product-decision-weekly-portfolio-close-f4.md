# Product Decision — Weekly portfolio close + cron (F4)

- **Data:** 2026-08-13
- **Decisão:** **BUILD**
- **Classificação:** PLATFORM (fechamento temporal / cron / idempotência)
- **Branch:** `feat/weekly-portfolio-close-cron-f4`
- **Pré-requisito:** F1, F2 e F3 em `main` (F3 E2E PASS)
- **Não autoriza:** dashboard, KPIs, badges, alertas visuais, notificações, lazy enrollment, auto-recycle, auto-WON/LOST, novos critérios HIGH/cap

## Sequência canônica

```text
F1 = DONE
F2 = DONE
F3 = DONE / E2E PASS
F4 = BUILD agora
DASHBOARD / KPIs / BADGES = NEXT
```

Depois do merge e validação:

```text
F1 = DONE
F2 = DONE
F3 = DONE
F4 = DONE / PRODUÇÃO / CRON VALIDADO
KPIs = BUILD agora
DASHBOARD / KPIs / BADGES = NEXT → dashboard depois desta camada
```

## Hipótese

Se o cron fechar semanas expiradas de forma idempotente — liberando só ACTIVE com motivo temporal, preservando TREATED e histórico, e recusando callback F3 de semana antiga — então a virada semanal não depende de abrir páginas nem de intervenção manual, e retries não corrompem estado.

## Invariantes

```text
semana é America/Sao_Paulo
persistência continua em UTC
fechamento é idempotente
WEEK_CLOSED não consome ciclo comercial
TREATED não recicla automaticamente
Minha fila continua read-only
callback F3 não cruza semana silenciosamente
AdminAuditEvent não usado no cron (sem system user)
Hobby cron = 1x/dia; service idempotente faz catch-up
```

## Escopo autorizado

1. Detectar `WeeklyPortfolio` com `weekEndAt < now` via o mesmo helper F1 (`getOperationalWeek`)
2. ACTIVE da semana expirada → `RELEASED` + `releaseReason = WEEK_CLOSED` + `releasedAt` uma vez
3. TREATED permanece TREATED; RELEASED existente não é reescrito
4. Sem status persistido no portfolio (fonte = datas)
5. Sem migration (string `WEEK_CLOSED` em `releaseReason`)
6. `countCommercialCycles` ignora `RELEASED` + `WEEK_CLOSED` (como `ADMIN_REASSIGN`)
7. Pool HIGH continua nas regras F2 (HIGH liberado pode voltar se cap/stage permitirem)
8. Callback `WALLET_FILL` com fingerprint de semana anterior → `assignedCount = 0` (não preenche a semana nova)
9. Endpoint `GET /api/cron/weekly-portfolio-close` autenticado com `CRON_SECRET` (Bearer, timing-safe)
10. `vercel.json` cron diário (`0 6 * * *` UTC) — Hobby não aceita cron horário

## Fora desta PR

- Dashboard, KPIs, badges, forecast, alertas, e-mail, WhatsApp
- Página `/admin/cron` ou `/admin/automations`
- Lazy enrollment / criar carteira na virada
- Rollover automático de meta semanal
- Cancelar/migrar `AcquisitionJob` para a semana nova
- `AdminAuditEvent` por fechamento (actorId é FK obrigatória para User; cron não finge ADMIN)

## Trilha de auditoria

Fechamento automático não grava `AdminAuditEvent`. Rastro:

- `LeadAssignment.status/releaseReason/releasedAt`
- JSON de retorno do cron (`portfoliosProcessed`, `assignmentsReleased`, `alreadyClosed`, `errors`)
- logs da plataforma de deploy

## Callback F3 tardio

```text
job permanece ligado ao fingerprint da semana original
fingerprint week ≠ semana atual → assignedCount = 0
não migrar job para a semana nova
fingerprint não-ISO (legado de teste) → comportamento F3 atual (semana de `now`)
```

## Métrica

Semana N opera → `weekEnd` → cron (ou retry) fecha ACTIVE com `WEEK_CLOSED` → TREATED segue aguardando ADMIN → nova semana nasce sem lazy enrollment → retry é no-op.
