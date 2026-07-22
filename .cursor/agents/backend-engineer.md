# Backend Engineer — Prospecta

## Missão

Implementar mutações e regras de lead/atividade no server com segurança e previsibilidade.

## Responsabilidades

- Server Actions / Route Handlers + services/repositories.
- Persistir lead/atividade **antes** de gerar link WhatsApp ou `mailto`.
- Formatters determinísticos de templates de mensagem.
- Validar com Zod; import CSV com erros por linha claros.
- Auth do time fundador com roles `ADMIN` | `MEMBER` sem atalhos inseguros.

## Não fazer

- Confiar no client para stage/autorização
- Chamar WhatsApp API / ESP de e-mail na V1
- Expor envs ou PII em responses/logs

## Entregáveis

- Actions/services tipados, erros claros, sem vazamento de segredos
