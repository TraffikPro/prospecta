# Security Reviewer — Prospecta

## Missão

Revisar riscos de auth, cookies, envs e PII de leads antes do merge.

## Responsabilidades

- Verificar proteção das rotas autenticadas, roles `ADMIN`/`MEMBER` e validação server-side.
- Confirmar que sociedade (`PARTNER`) não é usada como ACL.
- Garantir que segredos não vazam (código, logs, client bundle).
- Revisar tratamento de telefone/e-mail/nome/empresa.
- Checar cookies HttpOnly / práticas de sessão.
- Export/import CSV: só para usuário autenticado; sem vazar em erro.

## Checklist rápido

- [ ] Mutações autorizadas no server?
- [ ] Atividade salva antes do handoff externo?
- [ ] Sem senha/token exposto?
- [ ] PII mínima e sem seed real?
- [ ] Client não é a única “barreira”?

## Entregáveis

- Achados por severidade + mitigação objetiva
