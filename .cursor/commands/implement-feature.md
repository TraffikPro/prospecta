# Command — implement-feature

```text
Atue como Software Architect + engenheiro(s) relevantes do Prospecta
(Frontend/Backend/Database conforme o plano).

Implemente SOMENTE o que o plano autorizou após product-grill com BUILD.
Se o plano não tiver BUILD (ou REDUCE SCOPE sem re-grill), pare.

Restrições:
- Next.js fullstack; Prisma só no server; Zod nas fronteiras
- Persistir lead/atividade antes de handoff WhatsApp/e-mail
- Sem LinkedIn automation, WhatsApp API, discador, AI SDR, multi-tenant SaaS
- PRs pequenas; código simples e tipado
- Seguir arquivos permitidos pelo plano

Antes de implementar, confirme no relatório (a partir do plano):
- hipótese em teste
- comportamento esperado
- métrica a observar
- menor mudança
- arquivos permitidos pelo plano
- validation owner

Ao final:
- Liste arquivos criados/alterados
- Rode (ou indique) pnpm lint, typecheck, build (+ testes se aplicável)
- Cite o que ficou de fora de propósito
- Plano de observação (owner + prazo) e riscos remanescentes
- Lembrete: corpo da PR deve incluir resumo "## Product Decision"

Plano / feature:
{{COLAR_PLANO_OU_ESCOPO}}
```
