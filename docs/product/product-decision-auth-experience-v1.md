# Auth Experience v1 — Decision

- **Data:** 2026-07-23
- **Classificação:** PLATFORM
- **Relacionado:** [ADR 0005](../adr/0005-auth-sessions-acl-v1.md)

## Product Decision

```text
Fatia 1 — Auth UX Foundation: BUILD
Fatia 2 — Password Reset + Resend: PLANNED
Fatia 3 — mustChangePassword (primeiro acesso): DEFER
```

## Evidência

- Login + sessão + ACL já existem em produção com operadores reais.
- Ciclo de identidade incompleto (recuperação, primeiro acesso, UX de sessão).
- Não interfere no experimento comercial (lote Santos).

## Fatia 1 — BUILD (autorizada)

Escopo:

- Login Chakra refinado (loading, erros claros)
- Link “Esqueci minha senha”
- Rota `/forgot-password` com copy anti-enumeração (stub, sem e-mail)
- Redirect de sessão inválida → `/login?reason=session_expired`
- Mensagem: “Sua sessão expirou. Entre novamente para continuar.”

Fora:

- Prisma migration / `PasswordResetToken`
- Resend / envio de e-mail
- `mustChangePassword`
- MFA / OAuth / SSO / papéis novos

## Fatia 2 — PLANNED (Resend)

Provider aprovado: **Resend**, atrás de interface:

```text
Auth Recovery
      │
      ▼
Email Provider Interface
      │
      └── ResendAdapter
```

Checkpoint antes de implementar: uso real pelos operadores e necessidade de recuperação.

## Fatia 3 — DEFER

`mustChangePassword` / troca obrigatória no primeiro acesso — reavaliar após Fatia 2 estável.

## Hipótese

Fundação de identidade ↓ atrito de acesso e ↑ maturidade do case técnico, sem mudar o funil comercial.

## Métrica (Fatia 1)

- Login e ACL existentes continuam verdes
- E2E `auth-recovery-ui` cobre link, stub e mensagem de sessão
- Copy do forgot não revela existência de e-mail
