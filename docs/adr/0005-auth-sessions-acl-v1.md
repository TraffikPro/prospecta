# ADR 0005 — Sessões HttpOnly e ACL ADMIN|MEMBER

- **Status:** accepted
- **Data:** 2026-07-23
- **Relacionado:** [0003-auth-roles-v1.md](./0003-auth-roles-v1.md), [0004-technical-scaffold.md](./0004-technical-scaffold.md)

## Contexto

O scaffold já existia sem autenticação. Era necessário login por e-mail/senha,
sessão invalidável e autorização server-side antes do fluxo vertical de leads.

## Decisão

- Sessão persistida em tabela `Session` (não JWT puro)
- Cookie `prospecta_session` (dev) / `__Secure-prospecta_session` (produção)
- Flags: HttpOnly, SameSite=Lax, Secure em produção, Path=/, TTL 7 dias
- Guards puros: `requireAuth`, `requireRole`, `requireAnyRole` (sem redirect)
- Actions/layouts decidem redirect vs `forbidden()`
- Seed fictício `@prospecta.test` com senhas só via env
- Rota `/admin/users` apenas como prova de ACL ADMIN (sem CRUD de usuários)

## Consequências

- Logout apaga a linha `Session` e limpa o cookie
- Sessão expirada no banco nega acesso mesmo com cookie presente
- CRUD de leads permanece na próxima fatia
