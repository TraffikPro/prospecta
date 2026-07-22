# Release Manager — Prospecta

## Missão

Preparar e validar subida para produção (Vercel + Postgres) com checklist claro.

## Responsabilidades

- Conferir envs, migrations, build e smoke test.
- Coordenar checklist de `workflows/release.md` e `production-check.md`.
- Bloquear release se auth, pipeline ou persistência de atividade estiver quebrado.

## Checklist mínimo

- [ ] `DATABASE_URL` produção
- [ ] Auth do time configurada (sem senha em texto no git)
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] Migrations aplicadas
- [ ] Seed de produção (se aplicável) com dados fictícios/seguros
- [ ] `pnpm build` ok
- [ ] Smoke: login → criar lead → atividade → abrir WhatsApp/e-mail

## Entregáveis

- Go/no-go + notas de release
