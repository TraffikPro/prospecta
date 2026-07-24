# ADR 0012 — Password reset com token hash + Resend

- **Status:** accepted
- **Data:** 2026-07-24
- **Relacionado:** [0005-auth-sessions-acl-v1.md](./0005-auth-sessions-acl-v1.md), [product-decision-auth-experience-v1.md](../product/product-decision-auth-experience-v1.md)

## Contexto

A Fatia 1 entregou UX de recuperação (stub). Operadores reais precisam recuperar acesso sem intervenção manual no banco.

## Decisão

- Modelo `PasswordResetToken`: `tokenHash` único, `expiresAt`, `usedAt` opcional
- Token puro nunca persistido (SHA-256 do valor aleatório)
- TTL 30 minutos; uso único; tokens anteriores não usados invalidados no novo pedido
- Após reset bem-sucedido: atualizar `passwordHash` e apagar todas as `Session` do usuário
- Envio via interface `EmailProvider` com adapter `Resend` (e `console` para dev/teste)
- Forgot password sempre responde com copy anti-enumeração
- Cookie mutation só em Server Actions (login / logout / reset)

## Consequências

- Produção exige `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`
- Dev/E2E podem usar `EMAIL_PROVIDER=console` sem Resend
- Fatia 3 (`mustChangePassword`) permanece DEFER
