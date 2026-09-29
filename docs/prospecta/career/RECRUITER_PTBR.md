# Recruiter — Prospecta (PT-BR)

Versão humana, escaneável. Não é changelog.

## O produto

Prospecta é um CRM founder-led de prospecção B2B. O time precisa puxar oportunidades qualificadas, assumir ownership semanal e registrar contato real — não só clicar em WhatsApp.

## O problema

Quando a aquisição e os retries crescem, o CRM deixa de ser “cadastro de leads” e vira um problema de confiabilidade: corridas na ingestão, callbacks repetidos e contadores de carteira que podem regredir se forem last-write-wins.

## Ownership

Desenho e implementação end-to-end do CRM (produto + arquitetura fullstack): domínio comercial, API de ingestão, jobs de aquisição, portfolio/wallet, autenticação/ACL, testes em PostgreSQL e gates de CI/segurança. A coleta/score no Google Places fica em um runner externo; o Prospecta permanece a fonte da verdade.

## Resultado técnico (limitado ao que foi medido)

- Ingestão concorrente com a mesma identidade externa converge para um lead e respostas idempotentes nos cenários testados (incluindo 20 requisições paralelas).
- Callbacks de wallet-fill mantêm `ACTIVE` alinhado a `assignedCount` sob concorrência 1/5/10/20 no harness.
- Suite de código-fonte: 346/346 passando contra PostgreSQL local/efêmero.

## Arquitetura em uma frase

Next.js fullstack + PostgreSQL/Prisma, com runner externo de aquisição e contratos autenticados de sync/callback.

Detalhes e limites: [`../PROSPECTA_ENGINEERING_CASE.md`](../PROSPECTA_ENGINEERING_CASE.md)
