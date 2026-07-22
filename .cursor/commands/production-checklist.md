# Command — production-checklist

```text
Atue como Release Manager.

Monte ou execute o checklist de produção do Prospecta com base em
`.cursor/workflows/production-check.md`.

Cubra:
- DATABASE_URL, auth do time, NEXT_PUBLIC_APP_URL
- Migrations, seed seguro, domínio
- Smoke: login → lead → atividade → WhatsApp/e-mail
- Go / no-go com blockers

Não invente que integrações futuras (LinkedIn, WhatsApp API, sequências AI)
estão prontas.

Contexto do ambiente:
{{AMBIENTE}}
```
