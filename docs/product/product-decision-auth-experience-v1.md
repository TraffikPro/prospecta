# Auth Experience v1 — Decision

- **Data:** 2026-07-23 (atualizado 2026-07-24)
- **Classificação:** PLATFORM
- **Relacionado:** [ADR 0005](../adr/0005-auth-sessions-acl-v1.md), [ADR 0012](../adr/0012-password-reset-resend.md), [ADR 0013](../adr/0013-must-change-password.md)

## Product Decision

```text
Fatia 1 — Auth UX Foundation: BUILD (shipped — PR #9)
Fatia 2 — Password Reset + Resend: BUILD
Fatia 3 — mustChangePassword (primeiro acesso): BUILD
```

## Evidência

- Operadores reais com contas criadas manualmente / senha temporária.
- Fatia 1–2 cobrem UX e recovery; falta fechar o ciclo de primeiro acesso.
- Autorização explícita para Fatia 3.

## Fatia 1 — BUILD (shipped)

Login refinado, forgot stub, sessão expirada.

## Fatia 2 — BUILD

`PasswordResetToken`, Resend via `EmailProvider`, `/reset-password`, invalidação de sessões.

## Fatia 3 — BUILD (autorizada)

Escopo:

- `User.mustChangePassword`
- Login / rotas autenticadas → `/change-password` enquanto a flag estiver ativa
- Formulário: senha atual + nova + confirmação
- Limpar flag após troca bem-sucedida e após reset (Fatia 2)

Fora:

- CRUD de usuários na UI
- MFA / OAuth / SSO
- Expiração periódica de senha / política complexa

## Hipótese

Troca obrigatória no primeiro acesso ↓ credencial temporária permanente e ↑ higiene de identidade no piloto.

## Métrica (Fatia 3)

- Usuário com flag não acessa `/app` até trocar a senha
- Após troca, flag fica `false` e o app abre normalmente
- E2E cobre o gate + troca
