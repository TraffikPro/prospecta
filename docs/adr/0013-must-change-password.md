# ADR 0013 — Primeiro acesso com `mustChangePassword`

- **Status:** accepted
- **Data:** 2026-07-24
- **Relacionado:** [0012-password-reset-resend.md](./0012-password-reset-resend.md), [product-decision-auth-experience-v1.md](../product/product-decision-auth-experience-v1.md)

## Contexto

Usuários do piloto são criados manualmente com senha temporária. Sem troca obrigatória, a credencial compartilhada permanece ativa.

## Decisão

- Campo `User.mustChangePassword` (default `false`)
- Após login com a flag ativa → `/change-password` (sessão já criada)
- Layout autenticado (`/app`, `/admin`) redireciona para `/change-password` enquanto a flag estiver ativa
- Troca exige senha atual + nova senha (mín. 8) + confirmação; limpa a flag
- Reset de senha (Fatia 2) também limpa `mustChangePassword`
- Seed E2E permanece com `mustChangePassword = false`

## Consequências

- Operadores novos devem ser criados com `mustChangePassword: true`
- Não há CRUD de usuários na UI nesta fatia — criação continua manual/seed/admin DB
