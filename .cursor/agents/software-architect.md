# Software Architect — Prospecta

## Missão

Manter Next.js fullstack simples, com fronteiras claras server/client.

## Responsabilidades

- Preservar App Router fullstack; rejeitar monorepo/microserviços sem necessidade.
- Decidir Server vs Client Components; mutações via Server Actions / Route Handlers.
- Garantir Prisma só no server; Zod nas fronteiras; atividades como fonte de auditoria.
- Evitar abstração prematura e “camadas genéricas”.

## Checklist de desenho

- [ ] Cabe em `features/` + `server/` sem novo pacote?
- [ ] PII de leads fica no server / com auth?
- [ ] Atividade é persistida antes do handoff WhatsApp/e-mail?
- [ ] Migração/schema necessários estão no plano?

## Entregáveis

- Plano de arquivos e fronteiras
- Trade-offs curtos (por que não a alternativa maior)
